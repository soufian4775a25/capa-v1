import { useToast } from "@/hooks/use-toast";

export interface ExportData {
  trainerOccupationRate?: number;
  roomOccupationRate?: number;
  activeGroups?: number;
  totalGroups?: number;
  capacityRemaining?: number;
  totalTrainers?: number;
  totalRooms?: number;
  completedGroups?: number;
  delayedGroups?: number;
  trainerWorkload?: Array<{
    trainerId: string;
    name: string;
    currentHours: number;
    maxHours: number;
    occupationRate: number;
  }>;
  roomOccupancy?: Array<{
    roomId: string;
    name: string;
    occupiedHours: number;
    availableHours: number;
    occupationRate: number;
  }>;
  trainers?: any[];
  groups?: any[];
  modules?: any[];
  rooms?: any[];
  reportType?: string;
  period?: string;
  generatedAt?: string;
  capacityAnalysis?: any;
  schedules?: any[];
}

export async function exportToExcel(data: ExportData): Promise<void> {
  try {
    // Create a simple CSV format for Excel compatibility
    const csvContent = generateCSVContent(data);
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `rapport_chargecapa_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Échec de l\'export Excel');
  }
}

export async function exportToPDF(data: ExportData): Promise<void> {
  try {
    // Create a simple HTML content for PDF generation
    const htmlContent = generateHTMLContent(data);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Impossible d\'ouvrir la fenêtre d\'impression');
    }
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Trigger print dialog
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('Échec de l\'export PDF');
  }
}

function generateCSVContent(data: ExportData): string {
  const lines: string[] = [];
  
  // Header
  lines.push('RAPPORT CHARGECAPA - GESTION DE CAPACITÉ FORMATION');
  lines.push(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`);
  lines.push('');
  
  // Summary metrics
  lines.push('MÉTRIQUES GLOBALES');
  lines.push('Indicateur,Valeur');
  lines.push(`Occupation Formateurs,${data.trainerOccupationRate || 0}%`);
  lines.push(`Occupation Salles,${data.roomOccupationRate || 0}%`);
  lines.push(`Groupes Actifs,${data.activeGroups || 0}`);
  lines.push(`Groupes Totaux,${data.totalGroups || 0}`);
  lines.push(`Capacité Restante,${data.capacityRemaining || 0}%`);
  lines.push(`Total Formateurs,${data.totalTrainers || 0}`);
  lines.push(`Total Salles,${data.totalRooms || 0}`);
  lines.push('');
  
  // Capacity Analysis
  if (data.capacityAnalysis) {
    lines.push('ANALYSE DE CAPACITÉ');
    lines.push('Type,Nom,Statut,Détails');
    
    data.capacityAnalysis.trainerConstraints?.forEach(tc => {
      lines.push(`Formateur,${tc.name},${tc.isOverloaded ? 'Surcharge' : 'OK'},${tc.availableHours}h disponibles`);
    });
    
    data.capacityAnalysis.roomConstraints?.forEach(rc => {
      lines.push(`Salle,${rc.name},${rc.isOverbooked ? 'Surbookée' : 'OK'},${rc.availableCapacity}h libres`);
    });
    lines.push('');
    
    lines.push('RECOMMANDATIONS');
    data.capacityAnalysis.recommendations?.forEach(rec => {
      lines.push(`- ${rec}`);
    });
    lines.push('');
  }
  
  // Trainer workload
  if (data.trainerWorkload && data.trainerWorkload.length > 0) {
    lines.push('CHARGE DE TRAVAIL FORMATEURS');
    lines.push('Formateur,Heures Actuelles,Heures Maximum,Taux Occupation');
    data.trainerWorkload.forEach(trainer => {
      lines.push(`${trainer.name},${trainer.currentHours},${trainer.maxHours},${trainer.occupationRate}%`);
    });
    lines.push('');
  }
  
  // Room occupancy
  if (data.roomOccupancy && data.roomOccupancy.length > 0) {
    lines.push('OCCUPATION DES SALLES');
    lines.push('Salle,Heures Occupées,Heures Disponibles,Taux Occupation');
    data.roomOccupancy.forEach(room => {
      lines.push(`${room.name},${room.occupiedHours},${room.availableHours},${room.occupationRate}%`);
    });
    lines.push('');
  }
  
  // Schedules
  if (data.schedules && data.schedules.length > 0) {
    lines.push('PLANIFICATION MODULES');
    lines.push('Groupe,Module,Formateur,Ordre,Statut,Progression');
    data.schedules.forEach(schedule => {
      const groupName = data.groups?.find(g => g.id === schedule.groupId)?.name || 'Inconnu';
      const moduleName = data.modules?.find(m => m.id === schedule.moduleId)?.name || 'Inconnu';
      const trainerName = data.trainers?.find(t => t.id === schedule.trainerId)?.name || 'Inconnu';
      lines.push(`${groupName},${moduleName},${trainerName},${schedule.scheduledOrder},${schedule.status},${schedule.progress}%`);
    });
    lines.push('');
  }
  
  return lines.join('\n');
}

function generateHTMLContent(data: ExportData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Rapport ChargeCapa</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #3b82f6;
          margin-bottom: 10px;
        }
        .metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .metric-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
          text-align: center;
        }
        .metric-value {
          font-size: 24px;
          font-weight: bold;
          color: #3b82f6;
        }
        .metric-label {
          font-size: 14px;
          color: #6b7280;
          margin-top: 5px;
        }
        .section {
          margin-bottom: 30px;
        }
        .section h2 {
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        th, td {
          border: 1px solid #e5e7eb;
          padding: 8px 12px;
          text-align: left;
        }
        th {
          background-color: #f9fafb;
          font-weight: 600;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>ChargeCapa - Rapport de Capacité Formation</h1>
        <p>Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
      </div>
      
      <div class="section">
        <h2>Métriques Globales</h2>
        <div class="metrics">
          <div class="metric-card">
            <div class="metric-value">${data.trainerOccupationRate || 0}%</div>
            <div class="metric-label">Occupation Formateurs</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${data.roomOccupationRate || 0}%</div>
            <div class="metric-label">Occupation Salles</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${data.activeGroups || 0}</div>
            <div class="metric-label">Groupes Actifs</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${data.capacityRemaining || 0}%</div>
            <div class="metric-label">Capacité Restante</div>
          </div>
        </div>
      </div>
      
      ${data.trainerWorkload && data.trainerWorkload.length > 0 ? `
      <div class="section">
        <h2>Charge de Travail des Formateurs</h2>
        <table>
          <thead>
            <tr>
              <th>Formateur</th>
              <th>Heures Actuelles</th>
              <th>Heures Maximum</th>
              <th>Taux d'Occupation</th>
            </tr>
          </thead>
          <tbody>
            ${data.trainerWorkload.map(trainer => `
              <tr>
                <td>${trainer.name}</td>
                <td>${trainer.currentHours}h</td>
                <td>${trainer.maxHours}h</td>
                <td>${trainer.occupationRate}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
      
      ${data.roomOccupancy && data.roomOccupancy.length > 0 ? `
      <div class="section">
        <h2>Occupation des Salles</h2>
        <table>
          <thead>
            <tr>
              <th>Salle</th>
              <th>Heures Occupées</th>
              <th>Heures Disponibles</th>
              <th>Taux d'Occupation</th>
            </tr>
          </thead>
          <tbody>
            ${data.roomOccupancy.map(room => `
              <tr>
                <td>${room.name}</td>
                <td>${room.occupiedHours}h</td>
                <td>${room.availableHours}h</td>
                <td>${room.occupationRate}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
      
      ${data.capacityAnalysis ? `
      <div class="section">
        <h2>Analyse de Capacité</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3>Contraintes Formateurs</h3>
            <table>
              <thead>
                <tr>
                  <th>Formateur</th>
                  <th>Statut</th>
                  <th>Heures Disponibles</th>
                </tr>
              </thead>
              <tbody>
                ${data.capacityAnalysis.trainerConstraints?.map(tc => `
                  <tr>
                    <td>${tc.name}</td>
                    <td style="color: ${tc.isOverloaded ? '#dc2626' : '#16a34a'}">${tc.isOverloaded ? 'Surcharge' : 'OK'}</td>
                    <td>${tc.availableHours}h</td>
                  </tr>
                `).join('') || ''}
              </tbody>
            </table>
          </div>
          <div>
            <h3>Contraintes Salles</h3>
            <table>
              <thead>
                <tr>
                  <th>Salle</th>
                  <th>Type</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                ${data.capacityAnalysis.roomConstraints?.map(rc => `
                  <tr>
                    <td>${rc.name}</td>
                    <td>${rc.type === 'workshop' ? 'Atelier' : 'Salle'}</td>
                    <td style="color: ${rc.isOverbooked ? '#dc2626' : '#16a34a'}">${rc.isOverbooked ? 'Surbookée' : 'OK'}</td>
                  </tr>
                `).join('') || ''}
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="section">
          <h3>Recommandations</h3>
          <ul>
            ${data.capacityAnalysis.recommendations?.map(rec => `<li>${rec}</li>`).join('') || ''}
          </ul>
        </div>
      </div>
      ` : ''}
      
      <div class="footer">
        <p>ChargeCapa - Système de Gestion de Capacité Formation</p>
        <p>Ce rapport a été généré automatiquement par le système ChargeCapa</p>
      </div>
    </body>
    </html>
  `;
}
