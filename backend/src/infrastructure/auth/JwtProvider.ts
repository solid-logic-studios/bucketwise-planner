export interface JwtPayload {
  userId: string;
}

export interface JwtProvider {
  generateAccessToken(userId: string, expiresIn?: string): string;
  generateRefreshToken(userId: string, expiresIn?: string): string;
  verifyAccessToken(token: string): JwtPayload;
  verifyRefreshToken(token: string): JwtPayload;
}
