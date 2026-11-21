# Decisions

One short page for each architecture choice that a contributor would otherwise have to work out from commit messages. Each page says the context, the decision, what it costs, the measurement that made it, and how to undo it.

| Decision                                                               | Page                                         |
| ---------------------------------------------------------------------- | -------------------------------------------- |
| The English catalog is in parts that load with the code that uses them | [message-parts.md](message-parts.md)         |
| The project list is drawn from summary rows                            | [project-summaries.md](project-summaries.md) |
| The toaster loads when the first toast is raised                       | [lazy-toaster.md](lazy-toaster.md)           |
| `next` is pinned to an exact version                                   | [pinned-next.md](pinned-next.md)             |

## Adding a decision

Copy one of the pages, keep its five headings (Context, Decision, Cost, Measured, Undoing it), and name the commit or issue that made the change. Add a row to the table above. Keep it under a page: the code and the other docs say how it works, this says why.
