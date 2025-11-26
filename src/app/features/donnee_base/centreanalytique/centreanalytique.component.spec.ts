import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CentreanalytiqueComponent } from './centreanalytique.component';

describe('CentreanalytiqueComponent', () => {
  let component: CentreanalytiqueComponent;
  let fixture: ComponentFixture<CentreanalytiqueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CentreanalytiqueComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CentreanalytiqueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
