import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  UsersRound, 
  Building, 
  BarChart3, 
  FileText, 
  Grid3X3,
  LogOut 
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Tableau de Bord", href: "/dashboard", icon: LayoutDashboard },
  { name: "Formateurs", href: "/trainers", icon: Users },
  { name: "Modules", href: "/modules", icon: BookOpen },
  { name: "Groupes Formation", href: "/groups", icon: UsersRound },
  { name: "Salles & Ateliers", href: "/rooms", icon: Building },
  { name: "Matrice Compétences", href: "/competency-matrix", icon: Grid3X3 },
  { name: "Calcul Charge-Capa", href: "/capacity", icon: BarChart3 },
  { name: "Rapports", href: "/reports", icon: FileText },
];

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { logout } = useAuth();

  return (
    <aside className="w-64 bg-card shadow-lg border-r border-border">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-primary">ChargeCapa</h1>
        <p className="text-sm text-muted-foreground">Gestion Formation</p>
      </div>
      
      <nav className="p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <li key={item.name}>
                <button
                  onClick={() => setLocation(item.href)}
                  data-testid={`nav-${item.href.replace('/', '')}`}
                  className={cn(
                    "sidebar-item flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {item.name}
                </button>
              </li>
            );
          })}
        </ul>
        
        <div className="mt-8 pt-4 border-t border-border">
          <button
            onClick={logout}
            data-testid="button-logout"
            className="flex items-center px-4 py-3 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 w-full transition-colors"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </nav>
    </aside>
  );
}
