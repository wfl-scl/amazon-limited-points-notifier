// 更新間隔 (秒)
const updateInterval = 60;
// 挿入されるHTML要素のID
const limitedPointsElementId = 'extension-limited-points';

function getElementAsync(parent, selector) {
	return new Promise(resolve => {
		if (parent.querySelector(selector)) {
			return resolve(parent.querySelector(selector));
		}
		const observer = new MutationObserver(_ => {
			if (parent.querySelector(selector)) {
				observer.disconnect();
				resolve(parent.querySelector(selector));
			}
		});
		observer.observe(parent, {
			childList: true,
			subtree: true
		});
	});
}

async function fetchLimitedPointsAsync() {
	const response = await fetch('https://www.amazon.co.jp/mypoints');
	const html = await response.text();
	const document = new DOMParser().parseFromString(html, 'text/html');
	const points = document.querySelector(
		'[data-testid="time-limited-available-points-value"]' // 期間限定ポイント
		//'[data-testid="available-regular-points-value"]' // 通常ポイント
	);
	const result = {
		limitedPoints: points?.textContent.trim()
	};
	const expiration = document.querySelector(
		'[data-testid="expiry-table-expired-date"] .display-expiry-date-text' // 期間限定ポイント
		//'[data-testid="regular-points-expired-date"] .display-expiry-date-text' // 通常ポイント
	);
	if (expiration != null) {
		// textContentは後から設定されるっぽいのでdatasetから取得する
		const milliseconds = parseInt(expiration.dataset['dateTimestamp']);
		result['limitedPointsExpiration'] = new Date(milliseconds).toISOString();
	}
	return result;
}

async function tryAddLimitedPointElementAsync(limitedPoints) {
	const pointsElement = document.querySelector('#nav-discobar-jppoints-link');
	if (pointsElement.querySelector(`#${limitedPointsElementId}`)) {
		// 挿入済み
		return false;
	}
	let tagName, color;
	if (limitedPoints !== '0') {
		tagName = 'b';
		color = '#ff0000';
	} else {
		tagName = 'span';
		color = '#808080';
	}
	const limitedPointsElement = document.createElement(tagName);
	limitedPointsElement.id = limitedPointsElementId;
	limitedPointsElement.textContent = ` (${limitedPoints})`;
	limitedPointsElement.style.cssText = `color: ${color}`;

	// limitedPointsElement.addEventListener('mouseover', _ => console.log('mouseover'));
	// limitedPointsElement.addEventListener('mouseout', _ => console.log('mouseout'));

	// Amazonポイント表示完了まで待つ
	// browser.tabs.onUpdated の'complete'よりも後に表示される
	await getElementAsync(pointsElement, '.nav-b');

	pointsElement.appendChild(limitedPointsElement);
	return true;
}

async function mainAsync() {
	const storage = browser.storage.local;
	const storageItems = await storage.get(null);

	let updateRequired;
	if ('lastUpdate' in storageItems) {
		const lastUpdate = new Date(storageItems['lastUpdate']);
		updateRequired = new Date() > lastUpdate.setSeconds(lastUpdate.getSeconds() + updateInterval);
	} else {
		updateRequired = true;
	}

	if (updateRequired) {
		const limitedPoints = await fetchLimitedPointsAsync();
		if (limitedPoints != null) {
			Object.assign(storageItems, limitedPoints);
			storageItems['lastUpdate'] = new Date().toISOString();
			storage.set(storageItems);

			// background側に通知
			browser.runtime.sendMessage({
				type: 'updated',
				storageItems: storageItems
			});
		}
	}

	if ('limitedPoints' in storageItems) {
		await tryAddLimitedPointElementAsync(storageItems['limitedPoints']);
	}
}

mainAsync();
