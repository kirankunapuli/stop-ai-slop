# Examples

Before and after transformations for each slop pattern. The "before" is typical agent output. The "after" is what survives review.

## Contents

- [Speculative abstraction](#speculative-abstraction)
- [Redundant comments](#redundant-comments)
- [Stale comments](#stale-comments)
- [Swallowed errors](#swallowed-errors)
- [Defensive bloat](#defensive-bloat)
- [Generic naming](#generic-naming)
- [Reinvented stdlib](#reinvented-stdlib)
- [Hallucinated package](#hallucinated-package)
- [Plausible but wrong logic](#plausible-but-wrong-logic)
- [Test slop](#test-slop)
- [Test tampering](#test-tampering-and-reward-hacking)
- [N+1 query](#n1-query)
- [Commit message](#commit-message)
- [Pull request description](#pull-request-description)
- [Docs](#docs)
- [Report-only output](#report-only-output)

## Speculative abstraction

```python
# before
class UserRepositoryInterface(ABC):
    @abstractmethod
    def get(self, user_id: str) -> User: ...

class UserRepository(UserRepositoryInterface):
    def get(self, user_id: str) -> User:
        return self.db.query(User, user_id)

class UserRepositoryFactory:
    @staticmethod
    def create(db) -> UserRepositoryInterface:
        return UserRepository(db)

# after
def get_user(db, user_id: str) -> User:
    return db.query(User, user_id)
```

## Redundant comments

```ts
// before
// This function calculates the total price
function totalPrice(items: Item[]): number {
  // Initialize total to zero
  let total = 0;
  // Loop through each item
  for (const item of items) {
    // Add the item price to total
    total += item.price;
  }
  // Return the total
  return total;
}

// after
function totalPrice(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

## Stale comments

```python
# before
# Retries are handled by the caller.
def fetch(url):
    return requests.get(url, timeout=5)
```

If the caller no longer retries, the comment is a lie. Update it or delete it.

## Swallowed errors

```python
# before
def load_config(path):
    try:
        with open(path) as f:
            return json.load(f)
    except Exception:
        return {}

# after
def load_config(path):
    with open(path) as f:
        return json.load(f)
```

Let the caller decide what a missing config means. If the boundary must degrade, catch `FileNotFoundError` specifically and log the path.

## Defensive bloat

```python
# before
def send(user):
    if user is None:
        return
    if not hasattr(user, "email"):
        return
    email = user.email
    if email is None or email == "":
        return
    mailer.send(email)

# after
def send(user):
    mailer.send(user.email)
```

The caller must supply a user with an email. Check it once where the user is created.

## Generic naming

```python
# before
def process(data, flag):
    result = []
    for item in data:
        if flag:
            result.append(handle(item))
    return result

# after
def select_taxable_orders(orders, taxable_only):
    return [order for order in orders if not taxable_only or order.is_taxable]
```

## Reinvented stdlib

```js
// before
function isUUID(value) {
  if (typeof value !== "string" || value.length !== 36) return false;
  const parts = value.split("-");
  if (parts.length !== 5) return false;
  return parts.every((p) => /^[0-9a-f]+$/i.test(p));
}

// after
const isUUID = (value) =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
```

## Hallucinated package

```python
# before
from openai_utils import count_tokens  # package does not exist
```

The import looks plausible and fails at runtime. Confirm the package exists, is maintained, and is spelled correctly before adding it. A typo is how slopsquatting attacks get installed.

## Plausible but wrong logic

```python
# before
def is_expired(token):
    return time.time() < token.expires_at   # inverted
```

The code runs, the test that checks a fresh token passes, and expired tokens are accepted. Check the boundary and both directions: expired, and one second before expiry.

## Test slop

```python
# before
def test_add():
    result = add(2, 3)
    assert result is not None

# after
def test_add():
    assert add(2, 3) == 5

def test_add_negative():
    assert add(-2, -3) == -5
```

A test written by reading the code also locks in its bugs. Assert the required behavior, not the current output.

## Test tampering and reward hacking

```python
# before, agent was asked to make the failing test pass
def test_invoice_total():
    assert invoice_total(items) == 110   # actual code returns 100

# bad fix: edit the test
assert invoice_total(items) == 100

# good fix: fix the code
return sum(item.price for item in items) + tax
```

The failing assertion was the requirement. Changing it to match the bug makes the suite green and the product wrong. If the requirement genuinely changed, say so in the summary.

## N+1 query

```python
# before: one query per order
def order_totals(orders):
    return [sum(line.price for line in order.lines) for order in orders]

# after: one query for all lines
orders = Order.objects.prefetch_related("lines").filter(...)
```

The first version passes every test with 10 rows and times out with 10,000. Seed a realistic row count.

## Commit message

```text
# before
fix: Fixed the bug where the token expiry check was using the wrong
comparison operator, which was causing tokens to be considered valid
after they had actually expired. This was a minor issue that could
potentially cause security problems.

# after
fix: reject expired tokens

The expiry check used `<` instead of `<=`, so a token stayed valid
for one second after its deadline. Closes #412.
```

## Pull request description

```markdown
<!-- before -->
## Summary
This PR improves the performance of the data processing pipeline by
making various changes to the code. These changes are important and
should significantly improve things going forward.

## Changes
- Changed the query
- Updated the cache
- Refactored the parser

## Testing
Tested locally.

<!-- after -->
Batch invoice lines per customer instead of per line. The old N+1 query
ran 1,200 queries on a 1,200-line invoice; this runs 1. Closes #88.

Tested against the fixture in `tests/fixtures/large_invoice.csv`
(1,200 lines): 41s to 0.8s.
```

## Docs

```markdown
<!-- before -->
## Configuration
In this section, we will take a look at how to configure the client.
It's important to note that the client is highly configurable and can
be customized in a variety of different ways.

<!-- after -->
## Configuration
Pass `base_url` and `api_key`. Everything else has a default.
```

## Report-only output

Input: a review of `billing/invoice.py`.

```text
billing/invoice.py:14: Interface InvoiceBuilder has one implementation. Inline it.
billing/invoice.py:31: except Exception returns 0.0 and swallows parse failures. Let FlushError propagate; catch at the CLI boundary.
billing/invoice.py:52: unused import Decimal. Delete.
billing/invoice.py:58: docstring restates the signature. Delete.
billing/invoice.py:73: name `data` to `line_items`.
billing/invoice.py:90: reformatted untouched block (lines 90-140). Revert.
billing/invoice.py:104: expiry comparison uses `<` instead of `<=`. Expired tokens are accepted.
```

## What changed

After a fix, report one line per category:

- Inlined `InvoiceBuilder` into `build_invoice`.
- Removed `except Exception` in `parse_amount`; errors now surface at the CLI.
- Deleted the unused import and two restating comments.
- Renamed `data` to `line_items`.
- Reverted unrelated reformatting.
- Fixed the expiry comparison.
- Made the commit subject imperative and moved the why into the body.
