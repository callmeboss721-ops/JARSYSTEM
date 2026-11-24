"use client";

import type { ReactNode } from "react";
import {
  EmptyState as DesignSystemEmptyState,
  ErrorState,
  LoadingSpinner,
  LoadingState,
  Modal,
  SignedOutState as DesignSystemSignedOutState,
} from "@workspace/jaguar-spk-design-system/components/ui/feedback-states";

export { ErrorState, LoadingSpinner, LoadingState, Modal };

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return <DesignSystemEmptyState title={title} body={body} action={action} markSrc="/brand/jaguar-spk-mark.webp" />;
}

export function SignedOutState() {
  return <DesignSystemSignedOutState markSrc="/brand/jaguar-spk-mark.webp" />;
}
