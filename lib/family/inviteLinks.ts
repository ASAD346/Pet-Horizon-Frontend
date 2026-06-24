import * as Linking from 'expo-linking';
import type { GenerateInviteResponse } from '@/types/family';

/** Must match `scheme` in app.json */
export const APP_LINK_SCHEME = 'pethorizon';

/** Web host used for universal / app links (https). */
export const INVITE_WEB_HOST =
  process.env.EXPO_PUBLIC_INVITE_WEB_HOST?.replace(/^https?:\/\//, '').replace(/\/$/, '') ??
  'pethorizon.app';

/**
 * Deep link that opens this app at the invite accept screen.
 * Format: pethorizon://invite/{token}
 */
export function buildInviteAppLink(inviteToken: string): string {
  const token = encodeURIComponent(inviteToken);
  return Linking.createURL(`/invite/${token}`);
}

/** Prefer backend deep link when it uses our app scheme; otherwise build canonical invite URL. */
export function resolveInviteAppLink(
  invite: Pick<GenerateInviteResponse, 'inviteToken' | 'deepLink'>,
): string {
  if (invite.deepLink?.startsWith(`${APP_LINK_SCHEME}://`)) {
    return invite.deepLink;
  }
  return buildInviteAppLink(invite.inviteToken);
}

/** Prefer backend https link; fallback to a standard join URL on our web host. */
export function resolveInviteWebLink(
  invite: Pick<GenerateInviteResponse, 'inviteToken' | 'inviteLink'>,
): string {
  if (invite.inviteLink?.startsWith('http://') || invite.inviteLink?.startsWith('https://')) {
    return invite.inviteLink;
  }
  return `https://${INVITE_WEB_HOST}/join/family/${encodeURIComponent(invite.inviteToken)}`;
}

export function buildInviteShareMessage(
  invite: GenerateInviteResponse,
  webLink: string,
  appLink?: string,
): string {
  const petLine = invite.petName
    ? `Join ${invite.petName}'s care team on Pet Horizon.`
    : 'Join my pet on Pet Horizon.';
  const lines = [petLine, '', webLink];

  if (appLink && appLink !== webLink) {
    lines.push('', `Open in app: ${appLink}`);
  }

  return lines.join('\n');
}

/** Extract invite token from an incoming app or web URL. */
export function parseInviteTokenFromUrl(url: string): string | null {
  try {
    const parsed = Linking.parse(url);
    const path = (parsed.path ?? '').replace(/^\//, '');
    const hostname = parsed.hostname ?? '';

    const segments = path.split('/').filter(Boolean);

    const inviteIdx = segments.findIndex((s) => s.toLowerCase() === 'invite');
    if (inviteIdx >= 0 && segments[inviteIdx + 1]) {
      return decodeURIComponent(segments[inviteIdx + 1]);
    }

    const joinIdx = segments.findIndex((s) => s.toLowerCase() === 'join');
    if (joinIdx >= 0 && segments[joinIdx + 1]?.toLowerCase() === 'family' && segments[joinIdx + 2]) {
      return decodeURIComponent(segments[joinIdx + 2]);
    }

    // pethorizon://invite/TOKEN — hostname can be "invite"
    if (hostname.toLowerCase() === 'invite' && segments[0]) {
      return decodeURIComponent(segments[0]);
    }

    if (hostname.toLowerCase() === 'join' && segments[0]?.toLowerCase() === 'family' && segments[1]) {
      return decodeURIComponent(segments[1]);
    }

    const queryToken = parsed.queryParams?.token;
    if (typeof queryToken === 'string' && queryToken.length > 0) {
      return decodeURIComponent(queryToken);
    }
  } catch {
    return null;
  }

  return null;
}

/** Shorten and mask the sensitive token part of the invite link for visual display security. */
export function maskInviteLink(link: string | null | undefined): string {
  if (!link) return '—';
  // Match standard web join link format: protocol + host + /join/family/ + token
  const match = link.match(/^(https?:\/\/[^\/]+(?:\/join\/family\/|\/invite\/))(.+)$/i);
  if (match) {
    const base = match[1];
    const token = match[2];
    if (token.length > 8) {
      // E.g., https://pethorizon.app/join/family/••••••••f4e8
      return `${base}••••••••${token.slice(-4)}`;
    }
    return `${base}••••••••`;
  }
  
  if (link.length > 30) {
    return `${link.slice(0, 26)}••••••••`;
  }
  return link;
}
