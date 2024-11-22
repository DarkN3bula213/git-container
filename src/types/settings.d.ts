export interface UserSettings {
	_id: string;
	userId: string;
	notificationSettings: {
		showNotifications: boolean;
		showSystemMessages: boolean;
		showUserMessages: boolean;
	};
	appSettings: {
		showBanner: boolean;
	};
	privacySettings: {
		showProfile: boolean;
		showReadReceipts: boolean;
		privatePosts: boolean;
		showStatus: boolean;
	};
}
