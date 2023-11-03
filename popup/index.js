
function addElement(textContent) {
	const element = document.createElement('p');
	element.textContent = textContent;
	document.body.appendChild(element);
	return element;
}

function addLinkElement(href, linkText, afterText) {
	const element = document.createElement('a');
	element.href = href;
	element.innerText = linkText;
	document.body.appendChild(element);
	const textNode = document.createTextNode(afterText);
	element.after(textNode);
}

async function main() {
	const storage = browser.storage.local;
	const storageItems = await storage.get(null);

	if (!('limitedPoints' in storageItems)) {
		addElement('データがありません。');
		addLinkElement(
			'https://www.amazon.co.jp',
			'Amazon.co.jp',
			' にアクセスすることでデータを取得できます。'
		);
		return;
	}

	addElement(`期間限定ポイント: ${storageItems['limitedPoints']}`);

	const expiration = storageItems['limitedPointsExpiration'];
	let expirationString;
	if (expiration != null) {
		expirationString = new Date(expiration).toLocaleDateString(
			"ja-JP",
			{
				year: "numeric",
				month: "2-digit",
				day: "2-digit"
			}
		);
	} else {
		expirationString = '-';
	}
	addElement(`最短有効期限: ${expirationString}`);

	const lastUpdate = new Date(storageItems['lastUpdate']);
	const lastUpdateString = lastUpdate.toLocaleTimeString(
		"ja-JP",
		{
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour12: false
		}
	);
	addElement(`最終更新日時: ${lastUpdateString}`);
}

main();
