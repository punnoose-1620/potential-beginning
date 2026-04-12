# The Challenge

Build a system with three required components. Each component tests a different AI engineering capability.

-----

## **Component 1**: Intelligent Content Matching

When an RFP comes in, your system should semantically match the requirements to relevant products from the hotel's content library (via the Content API). This should not be keyword search, and it should not be dumping the entire product catalog into the LLM context.

Build a retrieval layer. Think about:

- How you embed and index product data

- How you chunk product information (titles, descriptions, images, pricing)

- How you handle the cold-start problem (first load from API, then index)

- How retrieval quality changes with catalog size

- When and how you refresh the index

-----

## **Component 2**: Agentic Proposal Builder

Build a multi-step AI pipeline that plans and executes proposal creation. This must not be a single prompt. Your system should:

1. Extract structured requirements from the RFP (dates, guest count, event type, budget signals, special requests)

2. Plan the proposal structure (which blocks, what products, what order)

3. Generate content for each block using retrieved products

4. Assemble and create the proposal via the Proposales API

5. Self-review the output against the original requirements and flag gaps or mismatches

We want to see how you decompose a complex task into orchestrated steps, how you handle errors when the LLM produces invalid output or an API call fails, and how you design prompts for each step rather than relying on a single mega-prompt.

-----

## **Component 3**: Quality & Evaluation

Build an automated evaluation system that scores the generated proposal against the original RFP. 
Most engineers skip this — we consider it essential.

Define quality dimensions (for example: completeness, product relevance, pricing accuracy, requirement coverage) and implement automated checks. 
These can be a mix of heuristic checks (are the dates present? does the guest count match?) and LLM-based evaluation (is the overall proposal coherent and professional?).

Display the evaluation results in your UI alongside the generated proposal.

-----

Here are the important documents when building the project

- [Deliverables](./Deliverables.md)

- [Evaluation Criteria](Evaluation%20Criteria.md)

- [Test Cases](./Test%20Cases.md)

- [API Endpoint for Proposales](API%20Endpoints.md)