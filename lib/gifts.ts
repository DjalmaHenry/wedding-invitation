export type GiftItem = {
  id: string;
  title: string;
  description: string;
  detail: string;
  image: string;
  minimum: number;
  suggestions: number[];
};

export const GIFT_ITEMS: GiftItem[] = [
  {
    id: "passagens",
    title: "Primeiro voo da nossa jornada",
    description: "Um empurrãozinho para começarmos essa história.",
    detail:
      "Sua contribuição ajuda a transformar o primeiro trecho da nossa aventura em uma lembrança inesquecível.",
    image: "/gift-flight-painted-v3.png",
    minimum: 80,
    suggestions: [150, 300, 500],
  },
  {
    id: "hospedagem",
    title: "Nosso refúgio entre paisagens",
    description: "Aconchego para recarregar as energias.",
    detail:
      "Um carinho para as noites de descanso entre um novo cenário e outro, sempre com uma surpresa nos esperando.",
    image: "/gift-stay-painted-v4.png",
    minimum: 80,
    suggestions: [120, 250, 450],
  },
  {
    id: "jantar",
    title: "Uma noite para brindar",
    description: "Um brinde aos primeiros dias dessa nova fase.",
    detail:
      "Ajude-nos a celebrar com uma experiência à mesa, feita de sabores, boas conversas e momentos só nossos.",
    image: "/gift-dinner-painted-v3.png",
    minimum: 70,
    suggestions: [70, 150, 250],
  },
  {
    id: "passeio",
    title: "Um novo horizonte",
    description: "Um novo cenário para guardarmos na memória.",
    detail:
      "Sua contribuição vira tempo para explorar, admirar paisagens e colecionar histórias sem revelar o roteiro.",
    image: "/gift-tour-painted-v3.png",
    minimum: 70,
    suggestions: [70, 200, 350],
  },
  {
    id: "diversao",
    title: "Um dia de encantamento",
    description: "Risadas e encantamento em uma parada especial.",
    detail:
      "Um presente para vivermos um dia leve, cheio de alegria e daquele friozinho bom na barriga.",
    image: "/gift-fun-painted-v3.png",
    minimum: 70,
    suggestions: [70, 250, 400],
  },
  {
    id: "carro",
    title: "Liberdade para seguir viagem",
    description: "Liberdade para nossos deslocamentos de ida e volta.",
    detail:
      "Este presente ajuda na locação do carro que nos acompanhará pelos trajetos de ida e volta da viagem.",
    image: "/gift-car-painted-v3.png",
    minimum: 80,
    suggestions: [150, 350, 600],
  },
  {
    id: "caminho",
    title: "Passeio especial com os pets",
    description: "Um dia de carinho, alegria e companhia especial.",
    detail:
      "Sua contribuição ajuda a transformar um passeio ao lado dos nossos companheiros de quatro patas em uma lembrança cheia de afeto.",
    image: "/gift-pets-painted-v1.png",
    minimum: 70,
    suggestions: [70, 160, 300],
  },
];

export function findGiftItem(id: string): GiftItem | undefined {
  return GIFT_ITEMS.find((gift) => gift.id === id);
}
