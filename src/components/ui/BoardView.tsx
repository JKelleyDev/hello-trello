// src/components/BoardView.tsx
import React from 'react';

export default function BoardView({ board }: { board: any }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">{board.name}</h2>
      <div className="flex gap-4 overflow-x-auto">
        {board.lists.map((list: any) => (
          <div key={list.id} className="bg-gray-100 rounded-md p-4 min-w-[250px]">
            <h3 className="font-bold text-lg mb-2">{list.name}</h3>
            <div className="space-y-2">
              {list.cards.map((card: any) => (
                <div key={card.id} className="bg-white p-2 rounded shadow">
                  {card.title}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
