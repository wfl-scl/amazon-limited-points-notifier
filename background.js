
function updateBadge(storageItems) {
	let showBadge, textColor, badgeColor;
	if ('limitedPoints' in storageItems) {
		// 期間限定ポイントが残っているときのバッジ
		showBadge = storageItems['limitedPoints'] !== '0';
		textColor = '#000000';
		badgeColor = '#0080c0';
	} else {
		// 期間限定ポイントが取得できていないときのバッジ
		showBadge = true;
		textColor = '#ffffff';
		badgeColor = '#ff0000';
	}

	browser.browserAction.setBadgeText({
		text: showBadge ? '!' : ''
	});
	browser.browserAction.setBadgeTextColor({
		color: textColor
	});
	browser.browserAction.setBadgeBackgroundColor({
		color: badgeColor
	});
}

async function updateAsync() {
	const storage = browser.storage.local;
	const storageItems = await storage.get(null);
	updateBadge(storageItems);
}

function handleMessage(message) {
	if (message['type'] === 'updated') {
		const storageItems = message['storageItems'];
		updateBadge(storageItems);
	}
}

// ページ更新時に表示更新する
browser.runtime.onMessage.addListener(handleMessage);
// ページの更新がなくてもストレージのデータで表示更新する
updateAsync();
