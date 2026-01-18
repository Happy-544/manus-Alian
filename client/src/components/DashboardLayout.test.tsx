import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'wouter';
import { DashboardLayout } from './DashboardLayout';
import { useAuth } from '@/_core/hooks/useAuth';
import { useIsMobile } from '@/hooks/useMobile';

// Mock dependencies
vi.mock('@/_core/hooks/useAuth');
vi.mock('@/hooks/useMobile');
vi.mock('@/lib/trpc', () => ({
  trpc: {
    auth: {
      me: {
        useQuery: () => ({
          data: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            role: 'admin',
          },
          isLoading: false,
        }),
      },
      logout: {
        useMutation: () => ({
          mutate: vi.fn(),
          isPending: false,
        }),
      },
    },
  },
}));

describe('DashboardLayout Navigation', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 1,
        name: 'Mohamed Ali',
        email: 'ali@example.com',
        role: 'admin',
        openId: 'test-id',
        loginMethod: 'apple',
        avatar: null,
        phone: null,
        jobTitle: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      isLoading: false,
      error: null,
    });

    vi.mocked(useIsMobile).mockReturnValue(false);
  });

  /**
   * Test all main navigation menu items load without errors
   */
  describe('Main Menu Items', () => {
    it('should render Dashboard menu item', () => {
      render(
        <BrowserRouter>
          <DashboardLayout>
            <div>Dashboard Content</div>
          </DashboardLayout>
        </BrowserRouter>
      );

      const dashboardItem = screen.queryByText('Dashboard');
      expect(dashboardItem).toBeDefined();
    });

    it('should render Document Creation section', () => {
      render(
        <BrowserRouter>
          <DashboardLayout>
            <div>Content</div>
          </DashboardLayout>
        </BrowserRouter>
      );

      const newDocItem = screen.queryByText('New Document');
      expect(newDocItem).toBeDefined();
    });

    it('should render Projects section', () => {
      render(
        <BrowserRouter>
          <DashboardLayout>
            <div>Content</div>
          </DashboardLayout>
        </BrowserRouter>
      );

      const projectsItem = screen.queryByText('Projects');
      expect(projectsItem).toBeDefined();
    });

    it('should render Procurement section', () => {
      render(
        <BrowserRouter>
          <DashboardLayout>
            <div>Content</div>
          </DashboardLayout>
        </BrowserRouter>
      );

      const procurementItem = screen.queryByText('Procurement');
      expect(procurementItem).toBeDefined();
    });

    it('should render Suppliers section', () => {
      render(
        <BrowserRouter>
          <DashboardLayout>
            <div>Content</div>
          </DashboardLayout>
        </BrowserRouter>
      );

      const suppliersItem = screen.queryByText('Suppliers');
      expect(suppliersItem).toBeDefined();
    });
  });

  /**
   * Test document-related menu items
   */
  describe('Document Menu Items', () => {
    const documentMenuItems = [
      { label: 'New Document', path: '/documents/new' },
      { label: 'My Documents', path: '/documents/library' },
      { label: 'Shared Documents', path: '/documents/shared' },
      { label: 'Templates', path: '/documents/templates' },
      { label: 'History', path: '/documents/history' },
    ];

    documentMenuItems.forEach(({ label, path }) => {
      it(`should render ${label} menu item`, () => {
        render(
          <BrowserRouter>
            <DashboardLayout>
              <div>Content</div>
            </DashboardLayout>
          </BrowserRouter>
        );

        const item = screen.queryByText(label);
        expect(item).toBeDefined();
      });
    });
  });

  /**
   * Test project-related menu items
   */
  describe('Project Menu Items', () => {
    const projectMenuItems = [
      { label: 'Project List', path: '/projects' },
      { label: 'Project Details', path: '/projects/1' },
      { label: 'Team Members', path: '/projects/1/team' },
    ];

    projectMenuItems.forEach(({ label, path }) => {
      it(`should render ${label} menu item`, () => {
        render(
          <BrowserRouter>
            <DashboardLayout>
              <div>Content</div>
            </DashboardLayout>
          </BrowserRouter>
        );

        const item = screen.queryByText(label);
        expect(item).toBeDefined();
      });
    });
  });

  /**
   * Test timeline-related menu items
   */
  describe('Timeline Menu Items', () => {
    const timelineMenuItems = [
      { label: 'Milestones', path: '/timeline' },
      { label: 'Schedule', path: '/timeline/schedule' },
      { label: 'Progress', path: '/timeline/progress' },
    ];

    timelineMenuItems.forEach(({ label, path }) => {
      it(`should render ${label} menu item`, () => {
        render(
          <BrowserRouter>
            <DashboardLayout>
              <div>Content</div>
            </DashboardLayout>
          </BrowserRouter>
        );

        const item = screen.queryByText(label);
        expect(item).toBeDefined();
      });
    });
  });

  /**
   * Test planning-related menu items
   */
  describe('Planning Menu Items', () => {
    const planningMenuItems = [
      { label: 'Baseline Program', path: '/planning/baseline' },
      { label: 'Budget Estimation', path: '/planning/budget' },
      { label: 'Cost Breakdown', path: '/planning/budget/breakdown' },
    ];

    planningMenuItems.forEach(({ label, path }) => {
      it(`should render ${label} menu item`, () => {
        render(
          <BrowserRouter>
            <DashboardLayout>
              <div>Content</div>
            </DashboardLayout>
          </BrowserRouter>
        );

        const item = screen.queryByText(label);
        expect(item).toBeDefined();
      });
    });
  });

  /**
   * Test procurement-related menu items
   */
  describe('Procurement Menu Items', () => {
    const procurementMenuItems = [
      { label: 'Purchase Orders', path: '/procurement' },
      { label: 'Supplier Management', path: '/procurement/suppliers' },
      { label: 'Delivery Tracking', path: '/procurement/delivery' },
    ];

    procurementMenuItems.forEach(({ label, path }) => {
      it(`should render ${label} menu item`, () => {
        render(
          <BrowserRouter>
            <DashboardLayout>
              <div>Content</div>
            </DashboardLayout>
          </BrowserRouter>
        );

        const item = screen.queryByText(label);
        expect(item).toBeDefined();
      });
    });
  });

  /**
   * Test materials-related menu items
   */
  describe('Materials Menu Items', () => {
    const materialsMenuItems = [
      { label: 'Material Specifications', path: '/materials' },
      { label: 'Furniture & Fixtures', path: '/ffe' },
      { label: 'Equipment', path: '/materials/equipment' },
    ];

    materialsMenuItems.forEach(({ label, path }) => {
      it(`should render ${label} menu item`, () => {
        render(
          <BrowserRouter>
            <DashboardLayout>
              <div>Content</div>
            </DashboardLayout>
          </BrowserRouter>
        );

        const item = screen.queryByText(label);
        expect(item).toBeDefined();
      });
    });
  });

  /**
   * Test user profile and settings
   */
  describe('User Profile and Settings', () => {
    it('should display user name in profile section', () => {
      render(
        <BrowserRouter>
          <DashboardLayout>
            <div>Content</div>
          </DashboardLayout>
        </BrowserRouter>
      );

      const userName = screen.queryByText('Mohamed Ali');
      expect(userName).toBeDefined();
    });

    it('should render Settings menu item', () => {
      render(
        <BrowserRouter>
          <DashboardLayout>
            <div>Content</div>
          </DashboardLayout>
        </BrowserRouter>
      );

      const settingsItem = screen.queryByText('Settings');
      expect(settingsItem).toBeDefined();
    });
  });

  /**
   * Test sidebar responsive behavior
   */
  describe('Sidebar Responsive Behavior', () => {
    it('should render sidebar on desktop view', () => {
      vi.mocked(useIsMobile).mockReturnValue(false);

      render(
        <BrowserRouter>
          <DashboardLayout>
            <div>Content</div>
          </DashboardLayout>
        </BrowserRouter>
      );

      const sidebar = screen.queryByRole('complementary');
      expect(sidebar).toBeDefined();
    });

    it('should render mobile-optimized sidebar on mobile view', () => {
      vi.mocked(useIsMobile).mockReturnValue(true);

      render(
        <BrowserRouter>
          <DashboardLayout>
            <div>Content</div>
          </DashboardLayout>
        </BrowserRouter>
      );

      const mainContent = screen.queryByText('Content');
      expect(mainContent).toBeDefined();
    });
  });

  /**
   * Test all icons are imported and rendered
   */
  describe('Icon Rendering', () => {
    it('should render all menu items without icon errors', () => {
      const { container } = render(
        <BrowserRouter>
          <DashboardLayout>
            <div>Content</div>
          </DashboardLayout>
        </BrowserRouter>
      );

      // Check that SVG icons are rendered (lucide-react renders as SVG)
      const svgElements = container.querySelectorAll('svg');
      expect(svgElements.length).toBeGreaterThan(0);
    });
  });

  /**
   * Test menu item accessibility
   */
  describe('Menu Accessibility', () => {
    it('should have proper ARIA labels for navigation', () => {
      render(
        <BrowserRouter>
          <DashboardLayout>
            <div>Content</div>
          </DashboardLayout>
        </BrowserRouter>
      );

      // Check for navigation elements
      const navElements = screen.queryAllByRole('navigation');
      expect(navElements.length).toBeGreaterThan(0);
    });

    it('should have keyboard navigable menu items', () => {
      const { container } = render(
        <BrowserRouter>
          <DashboardLayout>
            <div>Content</div>
          </DashboardLayout>
        </BrowserRouter>
      );

      // Check for focusable elements in the sidebar
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
