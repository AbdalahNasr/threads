"use client";

import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

interface PaginationProps {
  path: string;
  pageNumber: number;
  isNext: boolean;
}

function Pagination({ path, pageNumber, isNext }: PaginationProps) {
  const router = useRouter();

  const handleNavigation = (type: string) => {
    let nextPageNumber = pageNumber;

    if (type === "prev") {
      nextPageNumber = Math.max(1, pageNumber - 1);
    } else if (type === "next") {
      nextPageNumber = pageNumber + 1;
    }

    if (nextPageNumber === 1) {
      router.push(path);
    } else {
      router.push(`${path}?page=${nextPageNumber}`);
    }
  };

  if (!isNext && pageNumber === 1) return null;

  return (
    <div className="pagination">
      <Button
        onClick={() => handleNavigation("prev")}
        disabled={pageNumber === 1}
        className="!bg-dark-2"
      >
        Previous
      </Button>
      <p className="text-small-regular text-light-2">{pageNumber}</p>
      <Button
        onClick={() => handleNavigation("next")}
        disabled={!isNext}
        className="!bg-dark-2"
      >
        Next
      </Button>
    </div>
  );
}

export default Pagination;
