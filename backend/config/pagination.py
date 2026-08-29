from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    """Default pagination for the whole API. Page size defaults to 20 (set
    via PAGE_SIZE in settings) but clients can request more — e.g. the
    application tracker's Kanban board needs every application visible
    across all 5 columns at once, not paginated per column."""

    page_size_query_param = "page_size"
    max_page_size = 200
