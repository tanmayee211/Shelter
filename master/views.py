#!/usr/bin/python
# -*- coding: utf-8 -*-
"""The Django Views Page for master app"""
import json
import urllib2

from django.core.urlresolvers import reverse
from django.contrib.admin.views.decorators import staff_member_required
from django.template import RequestContext, loader
from django.http import HttpResponse, HttpResponseRedirect
from django.views.generic import ListView
from django.views.decorators.csrf import csrf_exempt
from django.views.generic.edit import FormView

from master.models import Survey, CityReference, Rapid_Slum_Appraisal, Slum
from master.forms import SurveyCreateForm, Rapid_Slum_AppraisalForm

from django.views.generic.base import View
from django.shortcuts import render
from django.core.paginator import Paginator, PageNotAnInteger

@staff_member_required
def index(request):
    """Renders the index template in browser"""
    template = loader.get_template('index.html')
    context = RequestContext(request, {})
    return HttpResponse(template.render(context))


class SurveyListView(ListView):
    """Renders the Survey View template in browser"""
    template_name = 'SurveyListView.html'
    model = Survey

    def get_queryset(self):
        try:
            filter_input = self.kwargs['name']
        except KeyError:
            filter_input = ''
        if filter_input != '':
            object_list = self.model.objects.filter(name__icontains=filter_input)
        else:
            object_list = self.model.objects.all()
        return object_list


class SurveyCreateView(FormView):
    """Fetches and renders the Add New Survey Mapping template in browser"""
    template_name = 'SurveyCreate_form.html'
    form_class = SurveyCreateForm
    success_url = 'SurveyCreate/'

    def dispatch(self, request, *args, **kwargs):
        """Signal Dispatcher"""
        try:
            if kwargs['survey']:
                self.id = kwargs['survey']
        except KeyError:
            print 'Error'
        return super(SurveyCreateView, self).dispatch(request, *args,
                                                      **kwargs)

    def get_context_data(self, **kwargs):
        """Returns a dictionary(json data format)"""
        context_data = super(SurveyCreateView,
                             self).get_context_data(**kwargs)
        try:
            if self.id:
                self.surveydata = Survey.objects.get(id=self.id)
                context_data['form'] = self.form_class(initial={
                    'name': self.surveydata.name,
                    'description': self.surveydata.description,
                    'city': self.surveydata.city,
                    'survey_type': self.surveydata.survey_type,
                    'analysis_threshold': self.surveydata.analysis_threshold,
                    'kobotool_survey_id': self.surveydata.kobotool_survey_id,
                    'survey': self.surveydata.id,
                    })
        except RuntimeError:
            print 'get_context_data Error'
        return context_data

    def get_form_kwargs(self):
        """'Get' request for form data"""
        kwargs = super(SurveyCreateView, self).get_form_kwargs()
        try:
            kwargs['survey'] = self.id
        except AttributeError:
            print 'get_form_kwargs Error'
        return kwargs

    def form_valid(self, form):
        """Actions to perform if form is valid"""
        form.save()
        return super(SurveyCreateView, self).form_valid(form)

    def form_invalid(self, form):
        """Actions to perform if form is invalid"""
        return super(SurveyCreateView, self).form_invalid(form)

    def get_success_url(self):
        """If form is valid -> redirect to"""
        return reverse('SurveyCreate')


def survey_delete_view(survey):
    """Delete Survey Object"""
    obj = Survey.objects.get(id=survey)
    if obj:
        obj.delete()
        message = 'Success'
    else:
        message = 'Failure'
    data = {}
    data['message'] = message
    return HttpResponseRedirect('/admin/surveymapping/')

@csrf_exempt
def search(request):
    """Autofill add city form fields based on City ID"""
    sid = request.POST['id']
    cityref = CityReference.objects.get(id=sid)
    data_dict = {
        'city_code': str(cityref.city_code),
        'district_name': str(cityref.district_name),
        'district_code': str(cityref.district_code),
        'state_name': str(cityref.state_name),
        'state_code': str(cityref.state_code),
        }
    return HttpResponse(json.dumps(data_dict),
                        content_type='application/json')

"""
class mypdfview(View):#url="http://kc.shelter-associates.org/api/v1/data/161?format=json" #url= "http://45.56.104.240:8001/api/v1/data/161?format=json"
    url= "http://45.56.104.240:8001/api/v1/data/161?format=json"
    req = urllib2.Request(url)
    req.add_header('Authorization', 'OAuth2 a0028f740988d80cbe670f24a9456d655b8dd419')
    resp = urllib2.urlopen(req)
    content = resp.read()
    data = json.loads(content)
    p=data[0]
    result=p['_attachments']
    datadict = {slumname :"PuneSlum"}
    SurveyNumber = 1
    img ="http://45.56.104.240:8001/media/"+result[0]['filename']
    template='report.html'
    context= {'img':img,'data':data,'datadict':datadict}
    def get(self, request):
        response = PDFTemplateResponse(request=request,
                                        template=self.template,
                                        filename="hello.pdf",
                                        context= self.context,
                                       show_content_in_browser=False,
                                       cmd_options={'margin-top': 50,},
                                       )
        return response

"""

def delete(request, Rapid_Slum_Appraisal_id):
    R = Rapid_Slum_Appraisal.objects.get(pk=Rapid_Slum_Appraisal_id)
    form = Rapid_Slum_AppraisalForm(instance= R)
    if request.method == 'POST':
        R.delete()
        return HttpResponseRedirect('/admin/display')
    return render(request, 'delete.html', {'form': form})

def display(request):
    if request.method=='POST':
        print request.POST['csrfmiddlewaretoken']
        deleteList=[]
        deleteList=request.POST.getlist('delete')
        for i in deleteList:
            R = Rapid_Slum_Appraisal.objects.get(pk=i)
            R.delete()             
    
    R = Rapid_Slum_Appraisal.objects.all()
    paginator = Paginator(R, 1) # Show 25 contacts per page
    page = request.GET.get('page')
    try:
        RA = paginator.page(page)
    except PageNotAnInteger:# If page is not an integer, deliver first page.
        RA = paginator.page(1)
    except EmptyPage:# If page is out of range (e.g. 9999), deliver last page of results.
        RA = paginator.page(paginator.num_pages)        
    return render(request, 'display5.html',{'R':R,'RA':RA})

def edit(request,Rapid_Slum_Appraisal_id):
    if request.method == 'POST':
        R = Rapid_Slum_Appraisal.objects.get(pk=Rapid_Slum_Appraisal_id)
        print request.POST
        print "#########################################################"
        print request.FILES
        form = Rapid_Slum_AppraisalForm(request.POST or None,request.FILES,instance=R)
        if form.is_valid():
            form.save()
            return HttpResponseRedirect('/admin/display')
        else:
            print form.errors
    elif request.method=="GET":
        R = Rapid_Slum_Appraisal.objects.get(pk=Rapid_Slum_Appraisal_id)
        form = Rapid_Slum_AppraisalForm(instance= R)
        print form        
    return render(request, 'edit.html', {'form': form})

def insert(request):
    if request.method == 'POST':
        form = Rapid_Slum_AppraisalForm(request.POST,request.FILES)
        print form
        if form.is_valid():
            form.save()
            return HttpResponseRedirect('/admin/display')
        else:
            print form.errors    
    else:
        form = Rapid_Slum_AppraisalForm()  
        print form      
    return render(request, 'insert.html', {'form': form})


"""
def edit(request,Rapid_Slum_Appraisal_id):
    if request.method == 'POST':
        form = Rapid_Slum_AppraisalForm(request.POST,request.FILES)
        print request.POST
        print request.FILES
        if form.is_valid():
            form.save()
            return HttpResponseRedirect('/admin/display')
        else:
            print form.errors
    elif request.method== 'GET':
        R = Rapid_Slum_Appraisal.objects.get(pk=Rapid_Slum_Appraisal_id)
        form = Rapid_Slum_AppraisalForm(instance= R)
    return render(request, 'edit.html', {'form': form})
    """

def listing(request):
    R = Rapid_Slum_Appraisal.objects.all()
    paginator = Paginator(R, 10) # Show 25 contacts per page
    page = request.GET.get('page')
    try:
        contacts = paginator.page(page)
    except PageNotAnInteger:
        # If page is not an integer, deliver first page.
        contacts = paginator.page(1)
    except EmptyPage:
        # If page is out of range (e.g. 9999), deliver last page of results.
        contacts = paginator.page(paginator.num_pages)

    return render(request, 'list.html', {'contacts': contacts})

