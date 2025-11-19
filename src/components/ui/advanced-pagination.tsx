import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface AdvancedPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  maxVisible?: number; // Số buttons hiển thị tối đa trước ellipsis (mặc định 10)
}

export function AdvancedPagination({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
  maxVisible = 10
}: AdvancedPaginationProps) {
  
  // Tính toán pages nào cần hiển thị
  const getPageNumbers = (): (number | 'ellipsis-left' | 'ellipsis-right')[] => {
    const pages: (number | 'ellipsis-left' | 'ellipsis-right')[] = [];
    
    // Nếu tổng pages <= maxVisible + 2, hiển thị hết
    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }
    
    // Tính toán range hiển thị dựa trên current page
    const halfVisible = Math.floor(maxVisible / 2);
    
    if (currentPage <= maxVisible) {
      // Gần đầu: 1 2 3 4 5 6 7 8 9 10 ... 157 158
      for (let i = 1; i <= maxVisible; i++) {
        pages.push(i);
      }
      pages.push('ellipsis-right');
      pages.push(totalPages - 1);
      pages.push(totalPages);
    } else if (currentPage >= totalPages - maxVisible + 1) {
      // Gần cuối: 1 2 ... 149 150 151 152 153 154 155 156 157 158
      pages.push(1);
      pages.push(2);
      pages.push('ellipsis-left');
      for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Ở giữa: 1 2 ... 49 50 [51] 52 53 ... 157 158
      pages.push(1);
      pages.push(2);
      pages.push('ellipsis-left');
      
      // Pages xung quanh current
      const start = Math.max(3, currentPage - halfVisible + 2);
      const end = Math.min(totalPages - 2, currentPage + halfVisible - 2);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      pages.push('ellipsis-right');
      pages.push(totalPages - 1);
      pages.push(totalPages);
    }
    
    return pages;
  };
  
  const pageNumbers = getPageNumbers();
  
  if (totalPages <= 1) {
    return null; // Không hiển thị pagination nếu chỉ có 1 page
  }
  
  return (
    <div className="flex items-center justify-center gap-1 flex-wrap">
      {/* First Page Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1 || disabled}
        className="w-10 h-10 p-0 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Trang đầu"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      
      {/* Previous Page Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || disabled}
        className="w-10 h-10 p-0 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Trang trước"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {/* Page Number Buttons */}
      {pageNumbers.map((page, index) => {
        if (page === 'ellipsis-left' || page === 'ellipsis-right') {
          return (
            <Button
              key={`ellipsis-${page}-${index}`}
              variant="outline"
              size="sm"
              disabled
              className="w-10 h-10 p-0 cursor-default rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
            >
              <span className="text-gray-400">...</span>
            </Button>
          );
        }
        
        const pageNum = page as number;
        const isActive = currentPage === pageNum;
        
        return (
          <Button
            key={pageNum}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPageChange(pageNum)}
            disabled={disabled}
            className={`w-10 h-10 p-0 rounded-lg font-semibold transition-all ${
              isActive 
                ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-green-500 shadow-md' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-300 dark:border-gray-600'
            }`}
          >
            {pageNum}
          </Button>
        );
      })}
      
      {/* Next Page Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || disabled}
        className="w-10 h-10 p-0 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Trang sau"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      
      {/* Last Page Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages || disabled}
        className="w-10 h-10 p-0 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Trang cuối"
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

