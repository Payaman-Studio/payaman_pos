export function groupByAlphabet<T extends { name: string }>(items: T[]) {
  const sections: { title: string; data: T[] }[] = [];
  for (const item of items) {
    const letter = item.name.trim()[0]?.toUpperCase() || '#';
    const lastSection = sections[sections.length - 1];
    if (lastSection?.title === letter) {
      lastSection.data.push(item);
    } else {
      sections.push({ title: letter, data: [item] });
    }
  }
  return sections;
}

export function getAllLetters(): string[] {
  return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
}
