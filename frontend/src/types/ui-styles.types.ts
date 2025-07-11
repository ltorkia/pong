import { alertStyles } from '../config/ui-styles.config';

export type AlertTheme = keyof typeof alertStyles;
export type AlertStyle = typeof alertStyles[AlertTheme];
