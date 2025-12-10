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
          <PaginationPrevious />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink
            size="default"
            className="min-w-[100px] justify-center"
          >{`${pageNumber} / ${numPages}`}</PaginationLink>
        </PaginationItem>
        <PaginationItem onClick={handleNextBtnClick} className="cursor-pointer">
          <PaginationNext />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default CustomPagination;
