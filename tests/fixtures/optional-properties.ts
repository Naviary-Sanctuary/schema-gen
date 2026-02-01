const fruits = ['apple', 'banana', 'cherry'] as const;
type Fruit = (typeof fruits)[number];

export class Product {
  id: string;
  description?: string;
  price: number;
  fruit?: Fruit;
}
