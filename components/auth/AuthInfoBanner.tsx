import React from 'react';

interface AuthInfoBannerProps {
  message: string;
}

export function AuthInfoBanner({ message }: AuthInfoBannerProps) {
  // Completely disabled globally per user request. Banners are not rendered anywhere.
  return null;
}
