import { BulkTab } from "@/components/bulk-tab"
import { CSVTab } from "@/components/csv-tab"
import { SingleTab } from "@/components/single-tab"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-end gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">fiscalino</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-0.5">Strumento di calcolo per il codice fiscale italiano</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Tabs defaultValue="single">
          <TabsList className="mb-6">
            <TabsTrigger value="single">Singolo</TabsTrigger>
            <TabsTrigger value="bulk">Massivo</TabsTrigger>
            <TabsTrigger value="csv">Import CSV</TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            <section>
              <h2 className="text-base font-semibold mb-1">Generazione singola</h2>
              <div className="w-full border-b border-border mb-6" />
              <SingleTab />
            </section>
          </TabsContent>

          <TabsContent value="bulk">
            <section>
              <h2 className="text-base font-semibold mb-1">Generazione massiva</h2>
              <div className="w-full border-b border-border mb-6" />
              <BulkTab />
            </section>
          </TabsContent>

          <TabsContent value="csv">
            <section>
              <h2 className="text-base font-semibold mb-1">Import CSV</h2>
              <div className="w-full border-b border-border mb-6" />
              <CSVTab />
            </section>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-border mt-16">
        <div className="max-w-5xl mx-auto px-4 py-4 text-xs text-muted-foreground">
          I codici generati con campi mancanti sono validi formalmente ma non corrispondono a persone reali.
          Motore di calcolo:{" "}
          <a
            href="https://www.npmjs.com/package/codice-fiscale-js"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            codice-fiscale-js
          </a>
          .
        </div>
      </footer>
    </div>
  )
}
