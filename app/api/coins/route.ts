import { NextResponse } from 'next/server';

const randomImages = [
  "https://i.kym-cdn.com/entries/icons/original/000/037/088/bmw_z4_by_scorpion87_dunxpb-fullview.jpg",
  "https://i.kym-cdn.com/editorials/icons/mobile/000/004/844/wise_mystical_tree_lore.jpg",
  "https://wompampsupport.azureedge.net/fetchimage?siteId=7575&v=2&jpgQuality=100&width=700&url=https%3A%2F%2Fi.kym-cdn.com%2Fphotos%2Fimages%2Fnewsfeed%2F002%2F232%2F140%2F791.jpg",
  "https://preview.redd.it/jf5ql9wfy0381.jpg?auto=webp&s=ad7c6e418996268428ded2ede07ddfa425591f8b",
  "https://i.imgur.com/fST1EXz.jpg",
  "https://i.pinimg.com/474x/72/72/0b/72720baaa9e47c3f29c1285592ee2835--secret-meme-spongebob.jpg",
  "https://i.kym-cdn.com/photos/images/original/002/300/052/66d"
];

const mockData = Array.from({ length: 20 }, (_, index) => ({
  id: index + 1,
  image: randomImages[Math.floor(Math.random() * randomImages.length)],
  shortName: `Coin${index + 1}`,
  name: `Coin Name ${index + 1}`,
  summary: `This is a summary for Coin Name ${index + 1}.`,
  percentComplete: Math.floor(Math.random() * 100),
  txns: Math.floor(Math.random() * 1000),
  totalVolume: `${(Math.random() * 100000).toFixed(2)}`
}));

export async function GET() {
  return NextResponse.json(mockData);
}
