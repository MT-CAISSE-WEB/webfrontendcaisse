import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TiersComponent } from './tiers.component';

describe('TiersComponent', () => {
  let component: TiersComponent;
  let fixture: ComponentFixture<TiersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TiersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TiersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
