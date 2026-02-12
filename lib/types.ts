import type { Session, User as UserBO } from "better-auth";

export type User = UserBO;

export interface AuthActionContext {
  user: UserBO;
  session: Session;
}

export interface ActionMetadata {
  actionName: string;
}
