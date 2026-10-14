// ── Interação ──────────────────────────────────────────────────────────────
export { Button, IconButton } from './Button';
export { Alert } from './Alert';
export { Card } from './Card';
export { Checkbox, CheckboxGroup } from './Checkbox';
export { Radio, RadioGroup } from './Radio';
export { DetailField } from './DetailField';
export { Drawer } from './Drawer';
export { Tooltip } from './Tooltip';
export { Popover, PopoverItem, PopoverDivider } from './Popover';
export { DropdownMenu } from './Dropdown';
export type { DropdownMenuItem } from './Dropdown';
export { Modal, ModalFooter, ConfirmModal } from './Modal';
export type { ModalProps } from './Modal';
export { ConfirmModal as ConfirmDialog } from './Modal';

// ── Formulários ────────────────────────────────────────────────────────────
export { Input, Textarea, Select } from './Input';
export { Switch } from './Switch';
export { DatePicker } from './DatePicker';
export { Calendar } from './Calendar';
export { Combobox } from './Combobox';
export { Tabs, Tab, TabList, TabPanel } from './Tabs';
export type { TabItem } from './Tabs';
export { default as RichTextEditor } from './RichTextEditor';

// ── Feedback ───────────────────────────────────────────────────────────────
export { Toast, ToastProvider, useToast } from './Toast';
export type { ToastType } from './Toast';
export { Badge, StatusBadge, PaymentBadge } from './Badge';
export { ProgressBar } from './ProgressBar';

// ── Layout / Estrutura ─────────────────────────────────────────────────────
export { PageWrapper, SectionTitle, StatGrid, ContentCard, FormRow, Divider } from './PageWrapper';
export { StatGrid as StatsGrid } from './PageWrapper';
export { PanelCard } from './PanelCard';
export { EmptyState } from './EmptyState';
export { Carousel } from './Carousel';

// ── Dados ──────────────────────────────────────────────────────────────────
export { StatCard } from './StatCard';
export { GridTable } from './GridTable';
export type { Column, GridTableProps } from './GridTable';
export { Table } from './Table';
export { Pagination, usePagination } from './Pagination';
export type { PaginationProps, UsePaginationReturn } from './Pagination';

// ── Filtros / Toolbar ──────────────────────────────────────────────────────
export {
  FilterLine,
  FilterLineSection,
  FilterLineItem,
  FilterLineGroup,
  FilterLineSegmented,
  FilterLineViewToggle,
  FilterLineSearch,
  FilterLineDateRange,
} from './FilterLine';

// ── Pagamentos ─────────────────────────────────────────────────────────────
export { PaymentModal } from './PaymentModal';
