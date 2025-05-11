// src/routes/api/details/[position]/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// This is mock data. In a real app, you'd fetch this from a database or another service.
const allElementsData = [
    { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H', notes: 'The first element.' },
    { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He', notes: 'Noble gas.' },
    { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li', notes: 'Alkali metal.' },
    { position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be', notes: 'Alkaline earth metal.' },
    { position: 5, name: 'Boron', weight: 10.811, symbol: 'B', notes: 'Metalloid.' },
    { position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C', notes: 'Basis of organic chemistry.' },
    { position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N', notes: 'Makes up most of the atmosphere.' },
    { position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O', notes: 'Essential for respiration.' },
    { position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F', notes: 'Highly reactive halogen.' },
    { position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne', notes: 'Noble gas used in signs.' }
];

export const GET: RequestHandler = async ({ params }) => {
    const position = parseInt(params.position, 10);

    if (isNaN(position)) {
        return json({ error: 'Invalid position parameter' }, { status: 400 });
    }

    const elementDetails = allElementsData.find(el => el.position === position);

    if (!elementDetails) {
        return json({ error: 'Element not found' }, { status: 404 });
    }

    // You might want to return only a subset of details or the full object
    return json({
        position: elementDetails.position,
        name: elementDetails.name,
        weight: elementDetails.weight,
        symbol: elementDetails.symbol,
        notes: elementDetails.notes // Example additional detail
    });
};
