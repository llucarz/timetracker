import { FileText, Shield, Cookie } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export function LegalPage() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="mb-2">Mentions légales</h1>
        <p className="text-[var(--color-text-secondary)]">
          Informations légales et politiques de confidentialité
        </p>
      </div>

      <Tabs defaultValue="legal" className="w-full">
        <TabsList className="mb-6 bg-[var(--color-surface)] border border-[var(--color-border)]">
          <TabsTrigger value="legal">
            <FileText className="w-4 h-4 mr-2" />
            Mentions légales
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Shield className="w-4 h-4 mr-2" />
            Confidentialité
          </TabsTrigger>
          <TabsTrigger value="cookies">
            <Cookie className="w-4 h-4 mr-2" />
            Cookies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="legal">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-8 prose prose-invert max-w-none">
            <h2 className="text-xl mb-4">Mentions légales</h2>
            
            <h3 className="text-lg mt-6 mb-3">Éditeur de l'application</h3>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              TimeTracker est une application web de suivi des heures de travail.<br />
              Application développée à des fins de gestion personnelle du temps.
            </p>

            <h3 className="text-lg mt-6 mb-3">Hébergement</h3>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              Les données sont stockées localement dans votre navigateur via localStorage.<br />
              Aucun serveur tiers ne stocke vos informations personnelles.
            </p>

            <h3 className="text-lg mt-6 mb-3">Propriété intellectuelle</h3>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              L'ensemble du contenu de cette application (structure, design, textes, graphismes) 
              est protégé par le droit d'auteur. Toute reproduction, même partielle, est interdite 
              sans autorisation préalable.
            </p>

            <h3 className="text-lg mt-6 mb-3">Responsabilité</h3>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              L'utilisateur est seul responsable de l'utilisation qu'il fait de l'application. 
              TimeTracker ne peut être tenu responsable des erreurs de saisie ou de calcul.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="privacy">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-8 prose prose-invert max-w-none">
            <h2 className="text-xl mb-4">Politique de confidentialité</h2>
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-400">
                <strong>Dernière mise à jour :</strong> 19 novembre 2025
              </p>
            </div>

            <h3 className="text-lg mt-6 mb-3">Données collectées</h3>
            <p className="text-[var(--color-text-secondary)] leading-relaxed mb-3">
              TimeTracker collecte uniquement les données que vous saisissez volontairement :
            </p>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-2 ml-4">
              <li>Nom et entreprise (optionnel)</li>
              <li>Horaires de travail (arrivée, pause, départ)</li>
              <li>Notes personnelles</li>
              <li>Préférences d'horaires</li>
            </ul>

            <h3 className="text-lg mt-6 mb-3">Stockage des données</h3>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              Toutes vos données sont stockées <strong>localement dans votre navigateur</strong> via 
              la technologie localStorage. Elles ne sont jamais transmises à un serveur externe, 
              sauf si vous utilisez la fonctionnalité de synchronisation cloud (optionnelle).
            </p>

            <h3 className="text-lg mt-6 mb-3">Synchronisation cloud (optionnel)</h3>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              Si vous activez la synchronisation cloud, vos données sont chiffrées de bout en bout 
              avant d'être transmises. Seul vous, avec votre clé de synchronisation, pouvez y accéder.
            </p>

            <h3 className="text-lg mt-6 mb-3">Données sensibles</h3>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <p className="text-sm text-amber-500">
                <strong>⚠️ Important :</strong> TimeTracker n'est pas conçu pour collecter 
                des données personnelles sensibles (santé, données bancaires, etc.). 
                Utilisez l'application uniquement pour le suivi du temps de travail.
              </p>
            </div>

            <h3 className="text-lg mt-6 mb-3">Vos droits (RGPD)</h3>
            <p className="text-[var(--color-text-secondary)] leading-relaxed mb-3">
              Conformément au RGPD, vous disposez des droits suivants :
            </p>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-2 ml-4">
              <li><strong>Droit d'accès :</strong> Vous pouvez exporter toutes vos données au format CSV</li>
              <li><strong>Droit de rectification :</strong> Vous pouvez modifier vos données à tout moment</li>
              <li><strong>Droit à l'effacement :</strong> Vous pouvez supprimer votre compte et toutes vos données</li>
              <li><strong>Droit à la portabilité :</strong> Vous pouvez exporter vos données</li>
            </ul>

            <h3 className="text-lg mt-6 mb-3">Contact</h3>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              Pour toute question concernant vos données personnelles, vous pouvez nous contacter 
              via les paramètres de l'application.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="cookies">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-8 prose prose-invert max-w-none">
            <h2 className="text-xl mb-4">Politique des cookies</h2>
            
            <h3 className="text-lg mt-6 mb-3">Qu'est-ce qu'un cookie ?</h3>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              Les cookies sont de petits fichiers texte stockés sur votre appareil lorsque vous 
              visitez un site web. Ils permettent de mémoriser vos préférences et de faciliter 
              votre navigation.
            </p>

            <h3 className="text-lg mt-6 mb-3">Cookies utilisés par TimeTracker</h3>
            <p className="text-[var(--color-text-secondary)] leading-relaxed mb-3">
              TimeTracker n'utilise <strong>aucun cookie tiers</strong> de tracking ou de publicité.
            </p>
            
            <div className="space-y-4 mt-4">
              <div className="bg-[var(--color-background)] rounded-lg p-4">
                <h4 className="text-sm mb-2">Cookies strictement nécessaires</h4>
                <p className="text-sm text-[var(--color-text-tertiary)]">
                  localStorage est utilisé pour stocker vos données d'heures localement. 
                  Ces données ne quittent jamais votre navigateur (sauf synchronisation cloud).
                </p>
              </div>

              <div className="bg-[var(--color-background)] rounded-lg p-4">
                <h4 className="text-sm mb-2">Cookies de préférences</h4>
                <p className="text-sm text-[var(--color-text-tertiary)]">
                  Vos préférences d'interface (thème, langue) sont stockées localement.
                </p>
              </div>
            </div>

            <h3 className="text-lg mt-6 mb-3">Gestion des cookies</h3>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              Vous pouvez à tout moment effacer les données stockées localement en supprimant 
              votre compte depuis les paramètres, ou en vidant le cache de votre navigateur.
            </p>

            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mt-6">
              <p className="text-sm text-green-500">
                ✅ <strong>Bonne nouvelle :</strong> TimeTracker ne vous tracke pas et ne partage 
                vos données avec aucun tiers.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
