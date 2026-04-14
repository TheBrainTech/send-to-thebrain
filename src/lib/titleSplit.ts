// Direct TypeScript port of TheBrainNetCore/src/TheBrain.Sys/HtmlUtility.cs
// (TrimTitleMetadata and GetTitleMetadata). Kept deliberately close to the C#
// so behaviour matches the desktop capture flow exactly.

const EXTRA_SPLITTERS: readonly string[] = [
	// Singles
	" - ",
	" \u2014 ",
	" | ",
	" . ",
	" = ",
	" + ",
	" / ",
	" ~ ",
	" ' ",
	" : ",
	" \u2254 ",
	" > ",
	" < ",
	// Doubles
	" -- ",
	" \u2014\u2014 ",
	" || ",
	" .. ",
	" == ",
	" ++ ",
	" // ",
	" ~~ ",
	" '' ",
	" :: ",
	" \u2254\u2254 ",
	" >> ",
	" << ",
];

const REVERSE_SPLITTERS: readonly string[] = [": "];

function normalize(title: string): string {
	return title.replace(/\u00A0/g, " ");
}

export function trimTitleMetadata(rawTitle: string): string {
	const title = normalize(rawTitle);
	let trimmed = false;
	let newTitle = title;
	for(const splitter of EXTRA_SPLITTERS) {
		const cut = title.indexOf(splitter);
		if(cut !== -1) {
			newTitle = title.substring(0, cut);
			trimmed = true;
		}
	}
	if(!trimmed) {
		for(const splitter of REVERSE_SPLITTERS) {
			const cut = title.indexOf(splitter);
			if(cut !== -1) {
				newTitle = title.substring(cut + splitter.length);
				break;
			}
		}
	}
	return newTitle.trim();
}

export function getTitleMetadata(rawTitle: string): string {
	let title = normalize(rawTitle);
	let metadata = "";
	for(const splitter of EXTRA_SPLITTERS) {
		const cut = title.indexOf(splitter);
		if(cut !== -1) {
			if(metadata.length > 0) {
				metadata += splitter;
			}
			metadata += title.substring(cut + splitter.length);
			title = title.substring(0, cut);
		}
	}
	if(metadata.length === 0) {
		for(const splitter of REVERSE_SPLITTERS) {
			const cut = title.indexOf(splitter);
			if(cut !== -1) {
				metadata = title.substring(0, cut);
				break;
			}
		}
	}
	return metadata.trim();
}

export interface SplitTitle {
	name: string;
	label: string;
}

export function splitTitle(rawTitle: string): SplitTitle {
	return {
		name: trimTitleMetadata(rawTitle),
		label: getTitleMetadata(rawTitle),
	};
}
