export class TokenBlacklist {
  private revoked = new Set<string>();

  add(token: string): void {
    if (token) this.revoked.add(token);
  }

  has(token: string): boolean {
    return token ? this.revoked.has(token) : false;
  }
}
