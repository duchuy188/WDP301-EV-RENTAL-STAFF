import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from 'lucide-react';

interface TablePaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  disabled?: boolean;
  itemsPerPageOptions?: number[];
}

export function TablePagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  disabled = false,
  itemsPerPageOptions = [5, 10, 20, 50]
}: TablePaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Tính toán các số trang cần hiển thị
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    
    if (totalPages <= 7) {
      // Hiển thị tất cả nếu ít hơn hoặc bằng 7 trang
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Luôn hiển thị trang đầu
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      // Hiển thị các trang xung quanh trang hiện tại
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i);
        }
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      // Luôn hiển thị trang cuối
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  if (totalItems === 0) {
    return (
      <div className="flex items-center justify-between py-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Không có dữ liệu
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-4 px-2 flex-wrap gap-4">
      {/* Left side: Items info and per-page selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          Hiển thị <span className="font-semibold">{startItem}-{endItem}</span> trên{' '}
          <span className="font-semibold">{totalItems}</span> mục
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">Hiển thị:</span>
          <Select 
            value={itemsPerPage.toString()} 
            onValueChange={(value) => {
              onItemsPerPageChange(Number(value));
              onPageChange(1); // Reset về trang 1 khi thay đổi items per page
            }}
            disabled={disabled}
          >
            <SelectTrigger className="h-9 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {itemsPerPageOptions.map((option) => (
                <SelectItem key={option} value={option.toString()}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-700 dark:text-gray-300">/ trang</span>
        </div>
      </div>

      {/* Right side: Pagination controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* First Page Button (<<) */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1 || disabled}
          className="h-9 px-3"
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
          className="h-9 px-3"
          title="Trước"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          <span>Trước</span>
        </Button>

        {/* Page Number Buttons */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <div
                  key={`ellipsis-${index}`}
                  className="h-9 w-9 flex items-center justify-center text-gray-500"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </div>
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
                className={`h-9 w-9 p-0 ${
                  isActive
                    ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        {/* Next Page Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || disabled}
          className="h-9 px-3"
          title="Sau"
        >
          <span>Sau</span>
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>

        {/* Last Page Button (>>) */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || disabled}
          className="h-9 px-3"
          title="Trang cuối"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

