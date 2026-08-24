/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail */
  to?: string
}

import { template as feedbackNotification } from './feedback-notification.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'feedback-notification': feedbackNotification,
}
