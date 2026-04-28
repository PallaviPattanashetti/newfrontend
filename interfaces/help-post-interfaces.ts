export const DEFAULT_HELP_CATEGORIES = [
  "home",
  "learning",
  "garden",
  "pet",
  "creative",
  "fitness",
] as const;

export type FixedHelpCategory = (typeof DEFAULT_HELP_CATEGORIES)[number];

export type HelpPostCategory = FixedHelpCategory | "other" | string;

export type HelpPostType = "request" | "offer";

export type HelpPost = {
  id: number;
  createdByUserId: number;
  creatorUsername: string;
  creatorName: string | null;
  creatorDescription: string | null;
  creatorProfilePictureUrl: string | null;
  creatorCredits: number;
  category: HelpPostCategory;
  postType: HelpPostType;
  title: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number | null;
  isOpen: boolean;
  createdAtUtc: string;
};

export type HelpCategoryItem = {
  category: string;
};

export type HelpCategoriesResponse = {
  data: HelpCategoryItem[];
};

export type HelpPostsResponse = {
  data: HelpPost[];
};

export type CreateHelpPostPayload = {
  category: string;
  postType: HelpPostType;
  title: string;
  description: string;
  latitude?: number;
  longitude?: number;
};

export type UpdateHelpPostPayload = {
  title?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
};

export type GetHelpPostsQuery = {
  category?: string;
  postType?: HelpPostType;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
};

export type ApiMessageResponse = {
  message?: string;
  success?: boolean;
};

export type StartHelpChatPayload = {
  helpPostId: number;
  message?: string;
};

export type HelpChatThread = {
  id: number;
  helpPostId: number;
  initiatorUserId: number;
  recipientUserId: number;
  initiatorName: string;
  recipientName: string;
  status: string;
  startedAtUtc: string;
  endedAtUtc: string | null;
};
