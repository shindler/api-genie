# api-genie

##changelog
v0.2.0
- api-genie is able to work with connect.js compatible solutions without grunt now
- standalone loggin introduced
- small refactoring
- new options format (changes in keys and structure) -> checking in index.js
- currentRequestContext enriched with new properties
-- genie provides a shared registry that can be used between requests (available under registry property in currentRequestContext. API: get + set methods similar to lodash)

v0.1.1
- bugfix
