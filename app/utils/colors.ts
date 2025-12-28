// Distinct color palette and helpers

const PALETTE = [
  '#FF5A5F', '#FF6B6B', '#FF8C42', '#FFB84D', '#FFC655',
  '#64C7CC', '#4ECDC4', '#44B7AA', '#3FA796', '#2ECC71',
  '#9B59B6', '#8E44AD', '#3498DB', '#2E86DE', '#1ABC9C',
  '#E74C3C', '#C0392B', '#F39C12', '#D68910', '#E67E22'
];

export function assignDistinctColors<T extends { properties?: any }>(
  features: Array<T>
): Array<T> {
  const shuffled = [...PALETTE].sort(() => Math.random() - 0.5);
  return features.map((f, idx) => {
    const color = shuffled[idx % shuffled.length];
    const props = { ...(f as any).properties, color };
    return { ...(f as any), properties: props } as T;
  });
}

export { PALETTE };
