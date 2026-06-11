import React from 'react';

function getVisiblePages(currentPage, totalPages, maxVisiblePages) {
  const visibleCount = Math.min(maxVisiblePages, totalPages);
  const half = Math.floor(visibleCount / 2);
  const start = Math.max(1, Math.min(currentPage - half, totalPages - visibleCount + 1));

  return Array.from({ length: visibleCount }, (_, index) => start + index);
}

function Pagination({
  page,
  totalPages,
  onPageChange,
  totalItems = 0,
  pageSize = 0,
  maxVisiblePages = 5,
  className = '',
  pageNumbersClassName = '',
  ariaLabel = 'Pagination',
  showSummary = false,
}) {
  if (totalPages <= 1) {
    return null;
  }

  const safePage = Math.min(Math.max(page, 1), totalPages);
  const visiblePages = getVisiblePages(safePage, totalPages, maxVisiblePages);
  const startItem = pageSize > 0 ? ((safePage - 1) * pageSize) + 1 : 0;
  const endItem = pageSize > 0 ? Math.min(safePage * pageSize, totalItems) : 0;

  return (
    <nav className={className} aria-label={ariaLabel}>
      {showSummary && totalItems > 0 && pageSize > 0 ? (
        <span>
          Showing {startItem}-{endItem} of {totalItems}
        </span>
      ) : null}
      <button type="button" onClick={() => onPageChange(safePage - 1)} disabled={safePage <= 1}>
        Previous
      </button>
      {pageNumbersClassName ? (
        <div className={pageNumbersClassName}>
          {visiblePages.map((pageNumber) => (
            <button
              type="button"
              key={pageNumber}
              className={pageNumber === safePage ? 'is-active' : ''}
              onClick={() => onPageChange(pageNumber)}
              aria-current={pageNumber === safePage ? 'page' : undefined}
            >
              {pageNumber}
            </button>
          ))}
        </div>
      ) : (
        <span>{safePage} / {totalPages}</span>
      )}
      <button type="button" onClick={() => onPageChange(safePage + 1)} disabled={safePage >= totalPages}>
        Next
      </button>
    </nav>
  );
}

export default Pagination;
