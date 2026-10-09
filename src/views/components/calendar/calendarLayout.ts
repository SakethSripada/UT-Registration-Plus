export interface CalendarLayoutCell {
    calendarGridPoint: { dayIndex: number; startIndex: number; endIndex: number };
    async: boolean;
    gridColumnStart?: number;
    gridColumnEnd?: number;
    totalColumns?: number;
    concurrentCells?: CalendarLayoutCell[];
}

export function calendarCellPosition(cell: CalendarLayoutCell, totalRows: number) {
    const { startIndex, endIndex } = cell.calendarGridPoint;
    return {
        top: `${((startIndex - 3) / totalRows) * 100}%`,
        height: `${((endIndex - startIndex) / totalRows) * 100}%`,
        left: `${(((cell.gridColumnStart ?? 1) - 1) / (cell.totalColumns ?? 1)) * 100}%`,
        width: `${100 / (cell.totalColumns ?? 1)}%`,
    };
}

/**
 * Determines all the connected components in the list of cells, where two cells
 * are "connected" if there is a path (potentially through other cells) where
 * each neighboring cells have overlapping start/end times
 *
 * @param cells - An array of cells to go on the calendar grid
 * @returns An array of connected components, where the inner array is a list of
 * all cells that there's a path to (potentially through other intervals)
 * without crossing a time gap
 *
 * @remarks The internal fields cell.concurrentCells and cell.hasParent are
 * modified by this function
 *
 * @example [[8am, 9am), [8:30am, 10am), [9:30am, 11am)] // is all one connected component
 * @example [[8am, 9am), [8:30am, 10am), [10am, 11am)] // has two connected components, [[8am, 9am), [8:30am, 10am)] and [[10am, 11am)]]
 */
const findConnectedComponents = (cells: CalendarLayoutCell[]): CalendarLayoutCell[][] => {
    const connectedComponents: CalendarLayoutCell[][] = [];

    for (let i = 0; i < cells.length; i++) {
        // biome-ignore lint/style/noNonNullAssertion: TODO:
        const cell = cells[i]!;

        if (!cell.concurrentCells || cell.concurrentCells.length === 0) {
            // If this cell isn't already part of an existing connected component,
            // then we need to make a new one.
            connectedComponents.push([]);
        }

        connectedComponents.at(-1)?.push(cell);

        for (let j = i + 1; j < cells.length; j++) {
            // biome-ignore lint/style/noNonNullAssertion: TOOD:
            const otherCell = cells[j]!;
            if (otherCell.calendarGridPoint.startIndex >= cell.calendarGridPoint.endIndex) {
                break;
            }

            // By ordering of cells array, we know cell.startTime <= other.startTime
            // By the if check above, we know cell.endTime > other.endTime
            // So, they're concurrent
            // Also, by initializing j to i + 1, we know we don't have duplicates
            cell.concurrentCells?.push(otherCell);
            otherCell.concurrentCells?.push(cell);
        }
    }

    return connectedComponents;
};

/**
 * Assigns column positions to each cell in a set of calendar grid cells.
 * Ensures that overlapping cells are placed in different columns.
 *
 * Inspired by the Greedy Interval-Partitioning algorithm.
 *
 * @param cells - An array of calendar grid course cells to position, must be
 * sorted in increasing order of start time
 * @throws Error if there's no available column for a cell (should never happen if totalColumns is calculated correctly)
 * @remarks The number of columns created is strictly equal to the minimum needed by a perfectly optimal algorithm.
 * The minimum number of columns needed is the maximum number of events that happen concurrently.
 * Research Interval Graphs for more info https://en.wikipedia.org/wiki/Interval_graph
 */
const assignColumns = (cells: CalendarLayoutCell[]) => {
    const availableColumns = [true];

    for (const cell of cells) {
        availableColumns.fill(true);
        // biome-ignore lint/style/noNonNullAssertion: TODO:
        for (const otherCell of cell.concurrentCells!) {
            if (otherCell.gridColumnStart !== undefined) {
                availableColumns[otherCell.gridColumnStart - 1] = false;
            }
        }

        // Find an available column, or create one if all columns are full
        let column = availableColumns.indexOf(true);

        if (column === -1) {
            column = availableColumns.length;
            availableColumns.push(true);
        }

        // CSS Grid uses 1-based indexing
        cell.gridColumnStart = column + 1;
        cell.gridColumnEnd = column + 2;
    }

    for (const cell of cells) {
        cell.totalColumns = availableColumns.length;
    }
};

/**
 * Calculates the column positions for course cells in a calendar grid.
 * This function handles the layout algorithm for displaying overlapping course meetings
 * in a calendar view. It identifies connected components of overlapping courses,
 * determines the number of columns needed for each component, and assigns appropriate
 * column positions to each cell.
 *
 * @param dayCells - An array of calendar grid course cells for a specific day
 */
export const calculateCourseCellColumns = (dayCells: CalendarLayoutCell[]) => {
    // Sort by start time, increasing
    // This is necessary for the correctness of the column assignment
    const cells = dayCells
        .filter(
            cell =>
                !cell.async &&
                cell.calendarGridPoint &&
                typeof cell.calendarGridPoint.startIndex === 'number' &&
                cell.calendarGridPoint.startIndex >= 0
        )
        .slice()
        .sort((a, b) => a.calendarGridPoint.startIndex - b.calendarGridPoint.startIndex);

    // Initialize metadata
    for (const cell of cells) {
        cell.concurrentCells = [];
        cell.gridColumnStart = undefined;
        cell.gridColumnEnd = undefined;
    }

    // Construct connected components, set concurrent neighbors
    const connectedComponents = findConnectedComponents(cells);

    // Assign columns for each connectedComponents
    for (const cc of connectedComponents) {
        assignColumns(cc);
    }

    // Clean up
    for (const cell of cells) {
        delete cell.concurrentCells;
    }
};
