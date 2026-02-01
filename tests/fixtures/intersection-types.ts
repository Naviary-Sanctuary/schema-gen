export class User {
  id: string;
  name: string;
}

export class ExtendedUser {
  profile: User & { timestamp: Date; version: number };
  mixed: { base: string } & { extra: number };
}
