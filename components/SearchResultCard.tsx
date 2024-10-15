import React from 'react';
import { Card, CardBody, Image, Link } from "@nextui-org/react";

interface SearchResultCardProps {
  result: {
    mint: {
      address: string;
      metadata: {
        name: string;
        symbol: string;
        image: string;
      };
    };
  };
}

const SearchResultCard: React.FC<SearchResultCardProps> = ({ result }) => {
  return (
    <Link href={`/token/${result.mint.address}`} className="block mb-2">
      <Card className="cursor-pointer hover:bg-white/5 transition-colors">
        <CardBody className="flex flex-row items-center p-2">
          <Image
            src={result.mint.metadata.image || "https://via.placeholder.com/40"}
            alt={result.mint.metadata.name}
            width={40}
            height={40}
            className="rounded-full mr-2"
          />
          <div>
            <p className="font-bold text-sm">{result.mint.metadata.name}</p>
            <p className="text-xs text-gray-400">{result.mint.metadata.symbol}</p>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
};

export default SearchResultCard;