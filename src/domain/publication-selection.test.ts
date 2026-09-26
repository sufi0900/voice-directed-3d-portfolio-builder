import {describe,it,expect} from 'vitest';
import {DEFAULT_SITE_DOCUMENT,validateSiteDocument} from './site-document';
import {applySiteCommand} from './commands';
import {buildPublicationSnapshot,homePublicationGroups,hasPublicationChanges,publicationChoices} from './publication-selection';
function fixture(){
 let doc=applySiteCommand(DEFAULT_SITE_DOCUMENT,{type:'publishing.add',kind:'page',title:'Detailed About'});
 const page=doc.publishing.pages[0];
 page.seoTitle='About the professional';page.seoDescription='Read about this professional and their work.';
 page.blocks=[{id:'paragraph',type:'paragraph',text:'Professional background and selected work.',headingLevel:'h2',items:[],mediaId:''}];
 doc=validateSiteDocument(doc);return doc;
}
describe('selective publication',()=>{
 it('publishes a selected draft while preserving the saved draft status',()=>{
  const draft=fixture();const id=draft.publishing.pages[0].id;
  const live=buildPublicationSnapshot(draft,undefined,[...homePublicationGroups,`page:${id}`]);
  expect(live.publishing.pages[0].status).toBe('published');expect(draft.publishing.pages[0].status).toBe('draft');
  expect(hasPublicationChanges(draft,live)).toBe(false);
 });
 it('preserves unselected live sections and includes only selected edits',()=>{
  const draft=fixture();const live=buildPublicationSnapshot(draft,undefined,[...homePublicationGroups]);
  draft.identity.name='New name';draft.content.about.heading='New about heading';
  const next=buildPublicationSnapshot(draft,live,['hero']);
  expect(next.identity.name).toBe('New name');expect(next.content.about.heading).toBe(live.content.about.heading);
  expect(next.publishing.pages).toHaveLength(0);expect(hasPublicationChanges(draft,next)).toBe(true);
 });
 it('keeps selected deletions explicit and supports individual unpublish',()=>{
  const draft=fixture();const id=draft.publishing.pages[0].id;
  const live=buildPublicationSnapshot(draft,undefined,[...homePublicationGroups,`page:${id}`]);
  expect(buildPublicationSnapshot(draft,live,[`page:${id}`],{kind:'page',id,status:'draft'}).publishing.pages).toHaveLength(0);
  draft.publishing.pages=[];
  expect(buildPublicationSnapshot(draft,live,['hero']).publishing.pages).toHaveLength(1);
  expect(buildPublicationSnapshot(draft,live,[`page:${id}`]).publishing.pages).toHaveLength(0);
  expect(publicationChoices(draft,live).some(row=>row.label.startsWith('Remove page'))).toBe(true);
 });
 it('blocks invalid selected content but allows unrelated home edits',()=>{
  const draft=fixture();const live=buildPublicationSnapshot(draft,undefined,[...homePublicationGroups]);
  draft.publishing.pages[0].seoTitle='';
  expect(()=>buildPublicationSnapshot(draft,live,[`page:${draft.publishing.pages[0].id}`])).toThrow('SEO title');
  expect(()=>buildPublicationSnapshot(draft,live,['hero'])).not.toThrow();
  expect(()=>buildPublicationSnapshot(draft,undefined,['hero'])).toThrow('first publication');
 });
 it('detects edited published content without relying on status',()=>{
  const draft=fixture();const id=draft.publishing.pages[0].id;
  const live=buildPublicationSnapshot(draft,undefined,[...homePublicationGroups,`page:${id}`]);
  draft.publishing.pages[0].title='Updated biography';expect(hasPublicationChanges(draft,live)).toBe(true);
  const next=buildPublicationSnapshot(draft,live,[`page:${id}`]);expect(hasPublicationChanges(draft,next)).toBe(false);
 });
});
