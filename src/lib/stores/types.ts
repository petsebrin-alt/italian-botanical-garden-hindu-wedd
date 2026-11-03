export interface Rsvp {
  id: string;
  name: string;
  attending: boolean;
  guests: number;
  events: string[];
  diet?: string;
  contact?: string;
  message?: string;
  editTokenHash: string;
  ipHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface Wish {
  id: string;
  name: string;
  relation?: string;
  message: string;
  status: "pending" | "approved" | "hidden";
  pinned?: boolean;
  ipHash: string;
  createdAt: string;
}

/** What a guest can change on their own RSVP. */
export type RsvpFields = Pick<Rsvp, "name" | "attending" | "guests" | "events" | "diet" | "contact" | "message">;

/** Everything the API routes and the studio need from storage. */
export interface Store {
  kind: "file" | "postgres";
  findRsvpByToken(editTokenHash: string): Promise<Rsvp | null>;
  findRsvpByIdentity(name: string, contact: string): Promise<Rsvp | null>;
  insertRsvp(row: Rsvp): Promise<void>;
  updateRsvp(id: string, fields: RsvpFields, updatedAt: string): Promise<void>;
  /** oldest first */
  listRsvps(): Promise<Rsvp[]>;
  insertWish(row: Wish): Promise<void>;
  /** pinned first, then newest first; `limit` omitted means all */
  listWishes(opts: { approvedOnly: boolean; offset?: number; limit?: number }): Promise<{ wishes: Wish[]; more: boolean }>;
  updateWish(id: string, patch: { status?: Wish["status"]; pinned?: boolean }): Promise<void>;
  deleteWish(id: string): Promise<void>;
  /** Counts one request against `key`; false once `limit` is reached inside the window. */
  hit(key: string, limit: number, windowMs: number): Promise<boolean>;
}
