import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { m as motion } from "framer-motion";
import type { ContactCard } from "../types";

interface ContactCardsSectionProps {
  cards: ContactCard[];
}

export function ContactCardsSection({ cards }: ContactCardsSectionProps) {
  return (
    <section className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 w-full -mt-8 sm:-mt-12 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full"
      >
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="w-full"
          >
            <Card className="border-2 border-transparent hover:border-primary/20 transition-all duration-300 shadow-lg hover:shadow-xl h-full w-full">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 p-3 sm:p-4 shadow-sm flex-shrink-0">
                    <card.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg sm:text-xl mb-1 break-words">{card.title}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm break-words">{card.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {card.href.startsWith("http") ? (
                  <a
                    href={card.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm sm:text-base font-semibold text-foreground hover:text-primary transition-colors group break-words"
                  >
                    {card.content}
                    {card.subcontent && (
                      <>
                        <br />
                        <span className="text-xs sm:text-sm font-normal text-muted-foreground">{card.subcontent}</span>
                      </>
                    )}
                    <span className="ml-2 inline-block group-hover:translate-x-1 transition-transform">→</span>
                  </a>
                ) : (
                  <a
                    href={card.href}
                    className="block text-sm sm:text-base font-semibold text-foreground hover:text-primary transition-colors break-words"
                  >
                    {card.content}
                    {card.subcontent && (
                      <>
                        <br />
                        <span className="text-xs sm:text-sm font-normal text-muted-foreground">{card.subcontent}</span>
                      </>
                    )}
                  </a>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

