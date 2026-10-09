import bcrypt from "bcrypt";
import { User, type UserDocument } from "models/user";
import { connectToDatabase } from "serverActions/mongoose-connector";
import { consume, isLimited, rateLimitKey, reset } from "utils/rateLimit";
import { PendingApprovalError, RateLimitedError } from "./authErrors";

/**
 * How many failed sign-ins are tolerated before an address or a connection
 * has to wait out the window. Per-address stops a guessing run against one
 * account; per-connection stops one machine spraying many accounts. Both
 * count failures only, so a classroom behind one NAT signing in together
 * never trips it.
 */
export const LOGIN_LIMITS = {
  perEmail: { limit: 10, windowSeconds: 15 * 60 },
  perIp: { limit: 30, windowSeconds: 15 * 60 },
} as const;

async function getUser(
  email: string,
  options: { withPassword?: boolean } = {}
): Promise<UserDocument | null> {
  try {
    await connectToDatabase();
    // The password hash is `select: false` on the schema; only the credentials
    // `authorize` flow opts in to it for bcrypt comparison.
    const query = User.findOne({ email });
    if (options.withPassword) query.select("+password");
    const user: UserDocument | null = await query;
    return user;
  } catch (error) {
    throw new Error("Failed to fetch user.");
  }
}

/**
 * The credentials check behind the sign-in form.
 *
 * Returns the user on success and `null` for anything that should read as
 * "invalid credentials". Throws `RateLimitedError` when the address or the
 * connection has failed too often recently, and `PendingApprovalError` when
 * the password was right but a teacher has not approved the account yet.
 * Order matters: the pending check comes after the password so its message
 * never confirms that an address is registered.
 */
export async function verifyCredentials({
  email,
  password,
  ip,
}: {
  email: string;
  password: string;
  ip: string;
}): Promise<UserDocument | null> {
  const emailKey = rateLimitKey("login:email", email);
  const ipKey = rateLimitKey("login:ip", ip);

  const [byEmail, byIp] = await Promise.all([
    isLimited(emailKey, LOGIN_LIMITS.perEmail.limit),
    isLimited(ipKey, LOGIN_LIMITS.perIp.limit),
  ]);
  if (!byEmail.allowed || !byIp.allowed) throw new RateLimitedError();

  const user = await getUser(email, { withPassword: true });
  const passwordsMatch = user
    ? await bcrypt.compare(password, user.password)
    : false;

  console.log("DEBUG auth attempt", {
    email,
    passwordLength: password.length,
    userFound: !!user,
    userStatus: user?.status,
    userEmail: user?.email,
    passwordsMatch,
    ip,
  });

  if (!user || !passwordsMatch) {
    console.log("DEBUG invalid credentials branch", {
      email,
      password,
      userExists: !!user,
      passwordsMatch,
    });
    await Promise.all([
      consume(
        emailKey,
        LOGIN_LIMITS.perEmail.limit,
        LOGIN_LIMITS.perEmail.windowSeconds
      ),
      consume(ipKey, LOGIN_LIMITS.perIp.limit, LOGIN_LIMITS.perIp.windowSeconds),
    ]);
    return null;
  }

  // A correct password proves it is the owner; don't hold earlier typos
  // against them. The per-connection counter stays, as it is not theirs alone.
  await reset(emailKey);

  if (user.status === "pending") throw new PendingApprovalError();
  return user;
}
