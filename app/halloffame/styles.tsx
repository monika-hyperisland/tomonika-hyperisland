"use client";
import styled from "styled-components";

export const PageContainer = styled.div`
  /* Full width: the gallery grid tiles to fill it. */
  max-width: 100%;
  margin: 0;
  padding: 40px 24px;

  @media (min-width: 768px) {
    padding: 60px 32px;
  }
`;

export const PageHeader = styled.div`
  text-align: left;
  margin-bottom: 28px;
`;

export const PageTitle = styled.h1`
  font-family: "Sunflower", sans-serif;
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--primary-black-100);
  margin: 0 0 16px 0;

  @media (min-width: 768px) {
    font-size: var(--text-4xl);
  }
`;

export const PageDescription = styled.p`
  font-family: "Source Sans 3", sans-serif;
  font-size: var(--text-base);
  color: var(--primary-black-60);
  max-width: 600px;
  margin: 0;

  @media (min-width: 768px) {
    font-size: var(--text-lg);
  }
`;
