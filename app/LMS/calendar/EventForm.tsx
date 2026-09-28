"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  createCalendarEvent,
  updateCalendarEvent,
  type ShareableUser,
} from "serverActions/calendarEvents";
import {
  DEFAULT_LECTURE_MINUTES,
  MAX_REPEAT_WEEKS,
  pickableCategories,
  defaultVisibility,
  describeDate,
  normalizeTime,
  todayKey,
  type CalendarEventInput,
} from "utils/calendarUtils";
import { CATEGORY_META } from "constants/semesterPlan";
import type {
  CalendarEvent,
  EventCategory,
  EventVisibility,
} from "types/calendarTypes";
import { Input } from "UIcomponents/input/Input";
import { Avatar } from "UIcomponents/avatar/Avatar";
import { useFormDraft } from "utils/hooks/useStorage";
import { DraftNotice } from "UIcomponents/draftNotice/DraftNotice";
import { Button } from "globalStyles/buttons/default/style";
import {
  Overlay,
  FormCard,
  FormTitle,
  FormGrid,
  FieldRow,
  Field,
  FieldLabel,
  NativeSelect,
  FieldHint,
  RadioRow,
  RadioLabel,
  FormActions,
  FormError,
  PeopleSearch,
  PeoplePicker,
  PersonOption,
  PickedSummary,
} from "./style";

type Props = {
  /** Present when editing. */
  initial?: CalendarEvent;
  /** The day to prefill when creating. */
  defaultDate?: string;
  isTeacher: boolean;
  /** The viewer's team, when they have one; enables "My team". */
  teamName?: string | null;
  /** Everyone the viewer may share with; enables "People I pick". */
  people?: ShareableUser[];
  onClose: () => void;
};

/** Above this many people, a search box is quicker than scrolling. */
const SEARCH_THRESHOLD = 8;

/**
 * Create or edit one event, in a dialog over the calendar.
 *
 * Teachers publish to everyone and may repeat an event weekly, which is how
 * a term's lectures get in without typing each one. Students choose who sees
 * theirs: everyone, their team, people they pick, or nobody else. Editing
 * one occurrence of a repeating event offers to apply the change to the
 * whole series; dates stay per occurrence.
 *
 * Times are plain text in 24-hour form rather than native time inputs,
 * which follow the browser locale and show AM/PM to many students here.
 * Dates keep the native picker, with the chosen day spelled out underneath
 * so the picker's own format never has to be read.
 */
export const EventForm = ({
  initial,
  defaultDate,
  isTeacher,
  teamName,
  people = [],
  onClose,
}: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const editing = !!initial;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState<EventCategory>(
    initial?.category ?? (isTeacher ? "lecture" : "groupwork")
  );
  const [startDate, setStartDate] = useState(
    initial?.date ?? defaultDate ?? todayKey()
  );
  const [endDate, setEndDate] = useState(
    initial?.endDate ?? initial?.date ?? defaultDate ?? todayKey()
  );
  const [startTime, setStartTime] = useState(initial?.time ?? "");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "");
  const [link, setLink] = useState(initial?.link ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [visibility, setVisibility] = useState<EventVisibility>(
    initial?.visibility ?? defaultVisibility(isTeacher)
  );
  const [sharedWith, setSharedWith] = useState<Set<string>>(
    () => new Set((initial?.sharedWith ?? []).map((person) => person.id))
  );
  const [query, setQuery] = useState("");
  const [repeatUntil, setRepeatUntil] = useState("");
  const [applyToSeries, setApplyToSeries] = useState(false);

  const [formError, setFormError] = useState<string | undefined>();
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[] | undefined>
  >({});
  const fieldError = (name: string) => fieldErrors[name]?.[0];

  // Closing the dialog by accident, or a reload, keeps what was typed.
  const draft = useFormDraft(
    editing ? `calendar-event:${initial.id}` : "calendar-event:new",
    {
      title,
      category,
      startDate,
      endDate,
      startTime,
      endTime,
      link,
      description,
      visibility,
      sharedWith: [...sharedWith],
      repeatUntil,
    },
    (saved) => {
      setTitle(saved.title);
      setCategory(saved.category);
      setStartDate(saved.startDate);
      setEndDate(saved.endDate);
      setStartTime(saved.startTime);
      setEndTime(saved.endTime);
      setLink(saved.link);
      setDescription(saved.description);
      setVisibility(saved.visibility);
      setSharedWith(new Set(saved.sharedWith));
      setRepeatUntil(saved.repeatUntil);
    }
  );

  // Escape closes, like any dialog.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const visiblePeople = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return people;
    return people.filter((person) => person.name.toLowerCase().includes(needle));
  }, [people, query]);

  const togglePerson = (id: string) =>
    setSharedWith((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const pickedNames = people
    .filter((person) => sharedWith.has(person.id))
    .map((person) => person.name);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(undefined);
    setFieldErrors({});

    // A teacher's event is always for everyone. The draft is shared with
    // student view, so a restored "People I pick" with nobody picked must
    // not reach the server, where it fails validation on a hidden field.
    const audience = isTeacher ? defaultVisibility(true) : visibility;
    const input: CalendarEventInput = {
      title,
      category,
      startDate,
      endDate: endDate > startDate ? endDate : "",
      startTime: normalizeTime(startTime),
      endTime: normalizeTime(endTime),
      link,
      description,
      visibility: audience,
      sharedWith: audience === "shared" ? [...sharedWith] : [],
      repeatWeeklyUntil: editing ? "" : repeatUntil,
    };

    startTransition(async () => {
      const result = editing
        ? await updateCalendarEvent(initial.id, input, { applyToSeries })
        : await createCalendarEvent(input);
      if (result.success) {
        draft.clear();
        router.refresh();
        onClose();
        return;
      }
      setFormError(result.message);
      if (result.errors) setFieldErrors(result.errors);
    });
  };

  const timeField = (
    id: string,
    label: string,
    value: string,
    setValue: (next: string) => void,
    errorKey: string
  ) => (
    <Input
      id={id}
      type="text"
      name={errorKey}
      label={label}
      inputMode="numeric"
      placeholder="10:00"
      pattern="([01]?[0-9]|2[0-3])[:.h]?[0-5]?[0-9]?"
      maxLength={5}
      disabled={isPending}
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        setValue(e.target.value)
      }
      onBlur={() => setValue(normalizeTime(value))}
      error={fieldError(errorKey)}
    />
  );

  const dialog = (
    <Overlay onClick={onClose}>
      <FormCard
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-form-title"
        onClick={(event) => event.stopPropagation()}
      >
        <FormTitle id="event-form-title">
          {editing ? "Edit event" : "New event"}
        </FormTitle>
        <form onSubmit={handleSubmit}>
          <DraftNotice restored={draft.restored} onDiscard={draft.discard} />
          <FormGrid>
            <Input
              id="event-title"
              type="text"
              name="title"
              label="Title"
              required
              autoFocus
              maxLength={120}
              disabled={isPending}
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setTitle(e.target.value)
              }
              error={fieldError("title")}
            />

            <Field>
              <FieldLabel htmlFor="event-category">Type</FieldLabel>
              <NativeSelect
                id="event-category"
                value={category}
                disabled={isPending || category === "meeting"}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
              >
                {(category === "meeting"
                  ? (["meeting"] as EventCategory[])
                  : pickableCategories(isTeacher)
                ).map((value) => (
                  <option key={value} value={value}>
                    {CATEGORY_META[value].label}
                  </option>
                ))}
              </NativeSelect>
              {category === "unavailable" && (
                <FieldHint>
                  Shown to everyone as striped time, and no meetings can be
                  booked with you then.
                </FieldHint>
              )}
              {category === "lecture" && isTeacher && (
                <FieldHint>
                  Students can&apos;t book a meeting while a lecture is on.
                  Add an end time so the right times drop out; without one
                  the lecture counts as {DEFAULT_LECTURE_MINUTES} minutes.
                </FieldHint>
              )}
              {category === "holiday" && isTeacher && (
                <FieldHint>No meetings can be booked on a holiday.</FieldHint>
              )}
            </Field>

            <FieldRow>
              <Field>
                <Input
                  id="event-start-date"
                  type="date"
                  name="startDate"
                  label="First day"
                  required
                  disabled={isPending}
                  value={startDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setStartDate(e.target.value);
                    if (endDate < e.target.value) setEndDate(e.target.value);
                  }}
                  error={fieldError("startDate")}
                />
                <FieldHint>{describeDate(startDate)}</FieldHint>
              </Field>
              <Field>
                <Input
                  id="event-end-date"
                  type="date"
                  name="endDate"
                  label="Last day"
                  disabled={isPending}
                  min={startDate}
                  value={endDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEndDate(e.target.value)
                  }
                  error={fieldError("endDate")}
                />
                <FieldHint>
                  {endDate > startDate ? describeDate(endDate) : "Same day"}
                </FieldHint>
              </Field>
            </FieldRow>

            <FieldRow>
              {timeField("event-start-time", "From (optional)", startTime, setStartTime, "startTime")}
              {timeField("event-end-time", "To (optional)", endTime, setEndTime, "endTime")}
            </FieldRow>
            <FieldHint>24-hour clock, e.g. 09:30 or 14:00.</FieldHint>

            <Input
              id="event-link"
              type="url"
              name="link"
              label="Link (optional)"
              placeholder="https://…"
              disabled={isPending}
              value={link}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setLink(e.target.value)
              }
              error={fieldError("link")}
            />

            <Input
              id="event-description"
              type="textarea"
              name="description"
              label="Description (optional)"
              rows={3}
              maxLength={2000}
              disabled={isPending}
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(e.target.value)
              }
              error={fieldError("description")}
            />

            {isTeacher ? (
              <FieldHint>Visible to everyone.</FieldHint>
            ) : (
              <Field>
                <FieldLabel as="span">Who can see this?</FieldLabel>
                <RadioRow role="radiogroup" aria-label="Who can see this">
                  <RadioLabel>
                    <input
                      type="radio"
                      name="visibility"
                      checked={visibility === "everyone"}
                      onChange={() => setVisibility("everyone")}
                      disabled={isPending}
                    />
                    Everyone
                  </RadioLabel>
                  <RadioLabel>
                    <input
                      type="radio"
                      name="visibility"
                      checked={visibility === "team"}
                      onChange={() => setVisibility("team")}
                      disabled={isPending || !teamName}
                    />
                    My team{teamName ? ` (${teamName})` : ""}
                  </RadioLabel>
                  <RadioLabel>
                    <input
                      type="radio"
                      name="visibility"
                      checked={visibility === "shared"}
                      onChange={() => setVisibility("shared")}
                      disabled={isPending || people.length === 0}
                    />
                    People I pick
                  </RadioLabel>
                  <RadioLabel>
                    <input
                      type="radio"
                      name="visibility"
                      checked={visibility === "private"}
                      onChange={() => setVisibility("private")}
                      disabled={isPending}
                    />
                    Only me
                  </RadioLabel>
                </RadioRow>
                {!teamName && (
                  <FieldHint>
                    You are not on a team right now, so &quot;My team&quot; is
                    off.
                  </FieldHint>
                )}
                {visibility === "shared" && (
                  <>
                    {people.length > SEARCH_THRESHOLD && (
                      <PeopleSearch
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by name"
                        aria-label="Search people"
                      />
                    )}
                    <PeoplePicker aria-label="People to share with">
                      {visiblePeople.length === 0 && (
                        <FieldHint>No one matches.</FieldHint>
                      )}
                      {visiblePeople.map((person) => (
                        <PersonOption key={person.id}>
                          <input
                            type="checkbox"
                            checked={sharedWith.has(person.id)}
                            onChange={() => togglePerson(person.id)}
                            disabled={isPending}
                          />
                          <Avatar
                            name={person.name}
                            url={person.avatarUrl}
                            size={22}
                          />
                          {person.name}
                        </PersonOption>
                      ))}
                    </PeoplePicker>
                    <PickedSummary>
                      {pickedNames.length === 0
                        ? "Nobody picked yet."
                        : `Shared with ${pickedNames.join(", ")}.`}
                    </PickedSummary>
                    {fieldError("sharedWith") && (
                      <FormError role="alert">{fieldError("sharedWith")}</FormError>
                    )}
                  </>
                )}
              </Field>
            )}

            {!editing && (
              <Field>
                <Input
                  id="event-repeat-until"
                  type="date"
                  name="repeatWeeklyUntil"
                  label="Repeat weekly until (optional)"
                  disabled={isPending}
                  min={startDate}
                  value={repeatUntil}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRepeatUntil(e.target.value)
                  }
                  error={fieldError("repeatWeeklyUntil")}
                />
                <FieldHint>
                  {repeatUntil
                    ? `Every week until ${describeDate(repeatUntil)}. `
                    : ""}
                  Makes one event per week, up to {MAX_REPEAT_WEEKS} weeks. Each
                  can be edited or removed on its own afterwards.
                </FieldHint>
              </Field>
            )}

            {editing && initial?.seriesId && (
              <RadioLabel>
                <input
                  type="checkbox"
                  checked={applyToSeries}
                  onChange={(e) => setApplyToSeries(e.target.checked)}
                  disabled={isPending}
                />
                Apply to every week of this event (dates stay as they are)
              </RadioLabel>
            )}
          </FormGrid>

          {formError && <FormError role="alert">{formError}</FormError>}

          <FormActions>
            <Button
              type="button"
              $styletype="outlined"
              onClick={onClose}
              disabled={isPending}
            >
              CANCEL
            </Button>
            <Button type="submit" $styletype="default" disabled={isPending}>
              {isPending ? "SAVING…" : editing ? "SAVE" : "ADD EVENT"}
            </Button>
          </FormActions>
        </form>
      </FormCard>
    </Overlay>
  );

  // Rendered into <body>: a fixed overlay inside the page layout would be
  // positioned against whichever ancestor carries a transform.
  return typeof document === "undefined"
    ? null
    : createPortal(dialog, document.body);
};
