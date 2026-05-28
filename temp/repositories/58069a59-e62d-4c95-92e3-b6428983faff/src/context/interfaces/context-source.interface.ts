import { ContextType } from '../enums/context-type.enum';

export interface ContextSource {
  type: ContextType;

  content: string;

  priority: number;
}
