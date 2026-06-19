import {
  Home,
  Award,
  UserCheck,
  Cog,
  LogOut,
  BookOpen,
  FileText,
  Building2,
  ChevronDown,
  Pin,
  PinOff,
  LayoutTemplate,
  Headset,
} from "lucide-react";
import { resolveLogoPath, imageFallbacks } from "@/utils/imageUtils";

import { Button } from "@/components/ui/button";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBranding } from "@/context/BrandingContext";
import { useState, useRef, useEffect, useCallback } from "react";
import { useHoverIntent } from "@/hooks/useHoverIntent";
import { useResponsive } from "@/hooks/useResponsive";
import {
  getSidebarState,
  setSidebarState,
  getSidebarWidth,
  isPointerNear,
  isTouchDevice as isTouchDeviceUtil,
} from "@/lib/sidebar-utils";

// Agrupamento de itens em seções conforme design system PanaLearn
const menuSections = [
  {
    label: "PRINCIPAL",
    items: [
      { title: "Dashboard", icon: Home, path: "/dashboard", roles: ["admin", "cliente", "admin_master"] },
    ],
  },
  {
    label: "CONTEÚDO",
    items: [
      { title: "Treinamentos", icon: BookOpen, path: "/treinamentos", roles: ["admin", "cliente", "admin_master"] },
      { title: "Quizzes", icon: FileText, path: "/quizzes", roles: ["admin", "admin_master"] },
      { title: "Certificados", icon: Award, path: "/certificados", roles: ["admin", "cliente", "admin_master"] },
      { title: "Templates de cert.", icon: LayoutTemplate, path: "/admin/certificados/templates", roles: ["admin", "admin_master"] },
    ],
  },
  {
    label: "GESTÃO",
    items: [
      { title: "Usuários", icon: UserCheck, path: "/usuarios", roles: ["admin", "admin_master"] },
      { title: "Empresas", icon: Building2, path: "/empresas", roles: ["admin_master"] },
    ],
  },
  {
    label: "SISTEMA",
    items: [
      { title: "Configurações", icon: Cog, path: "/configuracoes", roles: ["admin", "cliente", "admin_master"] },
      { title: "Meus dados", icon: FileText, path: "/meus-dados", roles: ["admin", "cliente", "admin_master"] },
      { title: "Suporte SLA", icon: Headset, path: "/suporte", roles: ["admin", "admin_master"] },
    ],
  },
];

// Submenu de configurações (mantido para compatibilidade)
function SidebarItem({
  icon: Icon,
  label,
  submenu,
  userType,
  isExpanded,
  onItemClick,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  submenu: { label: string; path: string; roles?: string[] }[];
  userType?: string;
  isExpanded: boolean;
  onItemClick: (path: string) => void;
}) {
  const location = useLocation();

  const visibleSubmenu = submenu.filter(
    (item) => !item.roles || item.roles.includes(userType || "")
  );

  const isAnySubmenuActive = visibleSubmenu.some(
    (item) =>
      location.pathname === item.path ||
      location.pathname.startsWith(item.path + "/") ||
      (item.path === "/configuracoes/preferencias" &&
        location.pathname === "/configuracoes")
  );

  const [open, setOpen] = useState(isAnySubmenuActive);

  return (
    <div>
      <button
        className="w-full flex items-center justify-between text-left text-sm rounded-md transition-all"
        style={{
          padding: "9px 12px",
          margin: "2px 0",
          background: isAnySubmenuActive ? "#4B3F72" : "none",
          color: isAnySubmenuActive ? "#E9D2C0" : "rgba(255,255,255,0.6)",
          transitionDuration: "200ms",
        }}
        onMouseEnter={(e) => {
          if (!isAnySubmenuActive)
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "rgba(255,255,255,0.07)";
        }}
        onMouseLeave={(e) => {
          if (!isAnySubmenuActive)
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "transparent";
        }}
        onClick={() => {
          if (isExpanded) setOpen((v) => !v);
          else onItemClick("/configuracoes");
        }}
        type="button"
      >
        <span className="flex items-center gap-2.5">
          <Icon
            className="h-4 w-4 flex-shrink-0"
            style={{ color: isAnySubmenuActive ? "#E9D2C0" : "rgba(255,255,255,0.6)" }}
          />
          <span
            className={`truncate transition-all duration-200 ${
              isExpanded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-1"
            }`}
          >
            {label}
          </span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""} ${
            isExpanded ? "opacity-100" : "opacity-0"
          }`}
        />
      </button>
      {open && isExpanded && (
        <div className="pl-8 mt-0.5 space-y-0.5">
          {visibleSubmenu.map((item) => {
            const isSpecialActive =
              item.path === "/configuracoes/preferencias" &&
              location.pathname === "/configuracoes";
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `block text-left text-xs py-2 px-2 rounded-md transition-all duration-200 ${
                    isActive || isSpecialActive
                      ? "font-medium"
                      : "hover:bg-white/[0.07]"
                  }`
                }
                style={({ isActive }) => ({
                  color:
                    isActive || isSpecialActive
                      ? "#E9D2C0"
                      : "rgba(255,255,255,0.55)",
                  backgroundColor:
                    isActive || isSpecialActive
                      ? "rgba(75,63,114,0.6)"
                      : undefined,
                })}
              >
                {item.label}
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ERASidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, userProfile } = useAuth();
  const { branding } = useBranding();
  const { isDesktop, isLargeDesktop } = useResponsive();
  const sidebarRef = useRef<HTMLDivElement>(null);

  const [sidebarState, setSidebarStateLocal] = useState<
    "collapsed" | "expanded" | "pinned"
  >(getSidebarState);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const updateSidebarState = useCallback(
    (newState: "collapsed" | "expanded" | "pinned") => {
      setSidebarStateLocal(newState);
      setSidebarState(newState);
    },
    []
  );

  const { handleMouseEnter, handleMouseLeave } = useHoverIntent({
    openDelay: 200,
    closeDelay: 500,
    onEnter: () => {
      if (
        !isTouchDevice &&
        sidebarState === "collapsed" &&
        (isDesktop || isLargeDesktop)
      ) {
        updateSidebarState("expanded");
      }
    },
    onLeave: () => {
      if (
        !isTouchDevice &&
        sidebarState === "expanded" &&
        (isDesktop || isLargeDesktop)
      ) {
        updateSidebarState("collapsed");
      }
    },
  });

  useEffect(() => {
    setIsTouchDevice(isTouchDeviceUtil());
  }, []);

  useEffect(() => {
    updateSidebarState(getSidebarState());
  }, [updateSidebarState]);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (sidebarRef.current && sidebarState === "collapsed") {
        isPointerNear(sidebarRef.current, event, 32);
      }
    },
    [sidebarState]
  );

  useEffect(() => {
    if (!isTouchDevice && (isDesktop || isLargeDesktop)) {
      document.addEventListener("mousemove", handleMouseMove);
      return () => document.removeEventListener("mousemove", handleMouseMove);
    }
  }, [isTouchDevice, isDesktop, isLargeDesktop, handleMouseMove]);

  const handleItemClick = useCallback(
    (path: string) => navigate(path),
    [navigate]
  );

  const togglePin = useCallback(() => {
    const newState = sidebarState === "pinned" ? "collapsed" : "pinned";
    updateSidebarState(newState);
  }, [sidebarState, updateSidebarState]);

  const isExpanded = sidebarState === "expanded" || sidebarState === "pinned";
  const sidebarWidth = getSidebarWidth(sidebarState);
  const userRole = userProfile?.tipo_usuario ?? "cliente";

  // Cor base da sidebar: respeita branding do tenant, fallback = Space Indigo
  const sidebarBg = branding.secondary_color || "#1F2041";

  return (
    <div
      ref={sidebarRef}
      className="flex flex-col h-full min-h-screen transition-[width] duration-200 ease-in-out"
      style={{
        width: `${sidebarWidth}px`,
        backgroundColor: sidebarBg,
        fontFamily: "var(--font-sans, 'Inter', sans-serif)",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-expanded={isExpanded}
    >
      {/* ── Logo ── */}
      <div
        className="relative flex-shrink-0"
        style={{ borderBottom: "0.5px solid rgba(255,255,255,0.1)" }}
      >
        {isExpanded ? (
          /* ── Sidebar expandida: logo horizontal versão "on-indigo" ── */
          <div
            className="flex items-center justify-center px-4 py-4 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => navigate("/dashboard")}
          >
            <img
              src="/brand/panalearn-horizontal-on-indigo.png"
              alt={branding.company_name || "PanaLearn"}
              id="sidebar-logo"
              className="h-10 object-contain"
              style={{ maxWidth: "80%" }}
              onError={(e) => {
                /* fallback: marca branca isolada */
                e.currentTarget.src = "/brand/panalearn-mark-white.png";
                e.currentTarget.className = "h-8 w-8 object-contain";
              }}
            />
          </div>
        ) : (
          /* ── Sidebar recolhida: marca branca isolada ── */
          <div
            className="flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity py-3"
            onClick={() => navigate("/dashboard")}
          >
            <img
              src="/brand/panalearn-mark-white.png"
              alt={branding.company_name || "PanaLearn"}
              id="sidebar-logo"
              className="h-8 w-8 object-contain"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          </div>
        )}

        {/* Botão de fixar */}
        <button
          className="absolute top-2 right-2 p-1 rounded transition-opacity duration-200"
          style={{
            opacity: isExpanded ? 1 : 0,
            color: "rgba(255,255,255,0.4)",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.color = "#E9D2C0")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.color =
              "rgba(255,255,255,0.4)")
          }
          onClick={togglePin}
          title={sidebarState === "pinned" ? "Desafixar" : "Fixar"}
        >
          {sidebarState === "pinned" ? (
            <PinOff className="h-3.5 w-3.5" />
          ) : (
            <Pin className="h-3.5 w-3.5" />
          )}
        </button>

        {isExpanded && (
          <p
            className="text-center py-2 text-xs"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            {branding.company_slogan || "Smart Training"}
          </p>
        )}
      </div>

      {/* ── Navegação ── */}
      <nav
        className="flex-1 overflow-y-auto py-3"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#45466B #1F2041" }}
      >
        {menuSections.map((section) => {
          const visibleItems = section.items.filter((item) =>
            item.roles.includes(userRole)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.label} className="mb-1" style={{ padding: "0 8px" }}>
              {/* Label da seção — só visível quando expandido */}
              {isExpanded && (
                <p
                  className="px-3 pb-1 pt-3"
                  style={{
                    fontSize: "10px",
                    fontWeight: 500,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.35)",
                  }}
                >
                  {section.label}
                </p>
              )}

              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive = location.pathname === item.path;

                  return (
                    <li key={item.path}>
                      <button
                        className="w-full flex items-center gap-2.5 rounded-md transition-all duration-200 text-sm"
                        style={{
                          padding: "9px 12px",
                          background: isActive ? "#4B3F72" : "transparent",
                          color: isActive ? "#E9D2C0" : "rgba(255,255,255,0.6)",
                          border: "none",
                          cursor: "pointer",
                          width: "100%",
                          textAlign: "left",
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive)
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                              "rgba(255,255,255,0.07)";
                          if (!isActive)
                            (e.currentTarget as HTMLButtonElement).style.color =
                              "rgba(255,255,255,0.85)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive)
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                              "transparent";
                          if (!isActive)
                            (e.currentTarget as HTMLButtonElement).style.color =
                              "rgba(255,255,255,0.6)";
                        }}
                        onClick={() => handleItemClick(item.path)}
                      >
                        <item.icon
                          className="h-4 w-4 flex-shrink-0"
                          style={{
                            color: isActive
                              ? "#E9D2C0"
                              : "rgba(255,255,255,0.6)",
                          }}
                        />
                        <span
                          className={`truncate transition-all duration-200 ${
                            isExpanded
                              ? "opacity-100 translate-x-0"
                              : "opacity-0 translate-x-1 w-0 overflow-hidden"
                          }`}
                        >
                          {item.title}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* ── Rodapé do usuário ── */}
      <div
        className="flex-shrink-0 p-3"
        style={{ borderTop: "0.5px solid rgba(255,255,255,0.1)" }}
      >
        <div
          className={`flex items-center gap-2.5 mb-2 transition-opacity duration-200 ${
            isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-full"
            style={{
              width: "32px",
              height: "32px",
              background: "#4B3F72",
            }}
          >
            <span
              className="text-xs font-medium"
              style={{ color: "#E9D2C0" }}
            >
              {userProfile?.nome
                ? userProfile.nome.charAt(0).toUpperCase()
                : "U"}
            </span>
          </div>
          {isExpanded && (
            <div className="min-w-0 flex-1">
              <p
                className="text-sm font-medium truncate"
                style={{ color: "#D0CEBA" }}
              >
                {userProfile?.nome || "Usuário"}
              </p>
              <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
                {userProfile?.tipo_usuario === "admin_master"
                  ? "Admin Master"
                  : userProfile?.tipo_usuario === "admin"
                  ? "Administrador"
                  : "Colaborador"}
              </p>
            </div>
          )}
        </div>

        <button
          className="w-full flex items-center gap-2.5 rounded-md text-sm transition-all duration-200"
          style={{
            padding: "9px 12px",
            color: "rgba(255,255,255,0.6)",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "rgba(255,255,255,0.07)";
            (e.currentTarget as HTMLButtonElement).style.color =
              "rgba(255,255,255,0.85)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "transparent";
            (e.currentTarget as HTMLButtonElement).style.color =
              "rgba(255,255,255,0.6)";
          }}
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span
            className={`truncate transition-all duration-200 ${
              isExpanded
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-1 w-0 overflow-hidden"
            }`}
          >
            Sair
          </span>
        </button>
      </div>
    </div>
  );
}
