const BASE = process.env.REACT_APP_API_URL || '';

export async function fetchMarketplace({ type = 'all', category = 'all' } = {}) {
  const params = new URLSearchParams();
  if (type !== 'all') params.set('type', type);
  if (category !== 'all') params.set('category', category);
  const url = `${BASE}/api/marketplace${params.size ? '?' + params : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function createListingViaApi({ title, description, category, price, location, listingType, images, sellerId, sellerName, sellerEmail }) {
  const res = await fetch(`${BASE}/api/marketplace`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description, category, price, location, listingType, images, sellerId, sellerName, sellerEmail }),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}
