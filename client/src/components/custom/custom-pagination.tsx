import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";

const CustomPagination = ({
  pageNumber,
  numPages,
  setPageNumber,
}: {
  pageNumber: number;
  numPages: number;
  setPageNumber: (page: number) => void;
}) => {
  function handlePreviousBtnClick() {
    setPageNumber(pageNumber > 1 ? pageNumber - 1 : 1);
  }

  function handleNextBtnClick() {
    setPageNumber(pageNumber < (numPages || 1) ? pageNumber + 1 : numPages);
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem
          onClick={handlePreviousBtnClick}
          className="cursor-pointer"
        >
          <PaginationPrevious size={2} />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink
            size={2}
          >{`${pageNumber} / ${numPages}`}</PaginationLink>
        </PaginationItem>
        <PaginationItem onClick={handleNextBtnClick} className="cursor-pointer">
          <PaginationNext size={2} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};
// Page {pageNumber} of {numPages}

export default CustomPagination;
