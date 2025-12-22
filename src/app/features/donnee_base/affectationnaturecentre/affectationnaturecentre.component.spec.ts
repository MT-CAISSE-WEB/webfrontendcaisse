import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AffectationnaturecentreComponent } from './affectationnaturecentre.component';

describe('AffectationnaturecentreComponent', () => {
  let component: AffectationnaturecentreComponent;
  let fixture: ComponentFixture<AffectationnaturecentreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AffectationnaturecentreComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AffectationnaturecentreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
